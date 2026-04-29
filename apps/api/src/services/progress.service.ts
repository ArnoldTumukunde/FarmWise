import { prisma } from '@farmwise/db';
import { storageService } from './cloudinary.service';

export class ProgressService {
    /**
     * Get a signed, short-lived (5 min) URL to download the HLS manifest.
     */
    static async getDownloadUrl(userId: string, lectureId: string) {
        // 1. Verify user is enrolled in the course that contains this lecture
        const lecture = await prisma.lecture.findUnique({
            where: { id: lectureId },
            include: { section: { include: { course: true } } }
        });

        if (!lecture || !lecture.section || !lecture.section.course) {
            throw new Error('Lecture not found');
        }

        const enrollment = await prisma.enrollment.findFirst({
            where: {
                userId,
                courseId: lecture.section.course.id,
                status: 'ACTIVE'
            }
        });

        if (!enrollment && !lecture.isPreview) {
            throw new Error('You must be enrolled to download this lecture');
        }

        if (!lecture.videoPublicId) {
            throw new Error('Lecture has no associated video');
        }

        // 2. Generate the signed URL (300 seconds = 5 minutes constraint)
        const storageSvc = storageService as any;
        if (!storageSvc.getSignedVideoUrl) {
           throw new Error('Storage service missing getSignedVideoUrl implementation');
        }
        const signedUrl = storageSvc.getSignedVideoUrl(lecture.videoPublicId, 300);

        return { url: signedUrl, enrollmentId: enrollment?.id };
    }

    /**
     * Record a successful download
     */
    static async recordDownload(userId: string, lectureId: string) {
        const lecture = await prisma.lecture.findUnique({ where: { id: lectureId }, include: { section: true } });
        if (!lecture) throw new Error('Lecture not found');

        const enrollment = await prisma.enrollment.findFirst({
            where: { userId, courseId: lecture.section.courseId, status: 'ACTIVE' }
        });

        if (!enrollment) throw new Error('Not enrolled');

        await prisma.offlineDownload.upsert({
            where: { userId_lectureId: { userId, lectureId } },
            update: { status: 'DOWNLOADED' },
            create: { userId, lectureId, enrollmentId: enrollment.id, status: 'DOWNLOADED' }
        });
    }

    /**
     * Mark a download as deleted
     */
    static async recordDownloadDeletion(userId: string, lectureId: string) {
        await prisma.offlineDownload.updateMany({
            where: { userId, lectureId },
            data: { status: 'DELETED' }
        });
    }

    /**
     * Sync progress from the offline db
     */
    static async syncProgress(userId: string, records: any[]) {
        // Sticky completion: never demote isCompleted=true → false.
        // Sticky watchedSeconds: max of existing + incoming so rewind/scrub doesn't regress.
        // Stamp completedAt on first transition to complete.
        for (const record of records) {
            const watched = Math.max(0, Number(record.watchedSeconds) || 0);
            const incomingComplete = !!record.isCompleted;

            const existing = await prisma.lectureProgress.findUnique({
                where: { userId_lectureId: { userId, lectureId: record.lectureId } },
                select: { isCompleted: true, watchedSeconds: true, completedAt: true },
            });

            const isCompleted = (existing?.isCompleted || incomingComplete);
            const newWatched = Math.max(existing?.watchedSeconds ?? 0, watched);
            const completedAt = isCompleted ? (existing?.completedAt ?? new Date()) : null;

            await prisma.lectureProgress.upsert({
                where: { userId_lectureId: { userId, lectureId: record.lectureId } },
                update: {
                    isCompleted,
                    watchedSeconds: newWatched,
                    lastWatchedAt: new Date(),
                    syncedAt: new Date(),
                    ...(completedAt ? { completedAt } : {}),
                },
                create: {
                    userId,
                    lectureId: record.lectureId,
                    enrollmentId: record.enrollmentId,
                    isCompleted,
                    watchedSeconds: newWatched,
                    lastWatchedAt: new Date(),
                    syncedAt: new Date(),
                    ...(completedAt ? { completedAt } : {}),
                },
            });
        }
    }
}
