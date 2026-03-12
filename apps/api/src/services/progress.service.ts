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
        for (const record of records) {
            await prisma.lectureProgress.upsert({
                where: { userId_lectureId: { userId, lectureId: record.lectureId } },
                update: {
                    isCompleted: record.isCompleted,
                    watchedSeconds: record.watchedSeconds,
                    syncedAt: new Date()
                },
                create: {
                    userId,
                    lectureId: record.lectureId,
                    enrollmentId: record.enrollmentId,
                    isCompleted: record.isCompleted,
                    watchedSeconds: record.watchedSeconds,
                    syncedAt: new Date()
                }
            });
        }
    }
}
