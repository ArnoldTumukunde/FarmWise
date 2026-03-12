import { prisma } from '@farmwise/db';

export class CommunityService {
    // --- NOTES ---
    static async getNotes(userId: string, lectureId: string) {
        return prisma.note.findMany({
            where: { userId, lectureId },
            orderBy: { timestamp: 'asc' }
        });
    }

    static async createNote(userId: string, lectureId: string, content: string, timestamp?: number) {
        return prisma.note.create({
            data: { userId, lectureId, content, timestamp }
        });
    }

    static async deleteNote(userId: string, noteId: string) {
        return prisma.note.deleteMany({
            where: { id: noteId, userId }
        });
    }

    // --- Q&A ---
    static async getQuestions(lectureId: string) {
        return prisma.question.findMany({
            where: { lectureId },
            include: {
                user: { select: { profile: { select: { displayName: true, avatarPublicId: true } } } },
                answers: {
                    include: {
                        user: { select: { role: true, profile: { select: { displayName: true, avatarPublicId: true } } } }
                    },
                    orderBy: [
                        { upvotes: 'desc' },
                        { createdAt: 'asc' }
                    ]
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async createQuestion(userId: string, lectureId: string, content: string) {
        return prisma.question.create({
            data: { userId, lectureId, content }
        });
    }

    static async createAnswer(userId: string, questionId: string, content: string) {
        return prisma.answer.create({
            data: { userId, questionId, content }
        });
    }

    static async upvoteAnswer(userId: string, answerId: string) {
        const existing = await prisma.answerUpvote.findUnique({
            where: { userId_answerId: { userId, answerId } }
        });
        
        if (existing) {
            await prisma.answerUpvote.delete({ where: { userId_answerId: { userId, answerId } } });
            await prisma.answer.update({ where: { id: answerId }, data: { upvotes: { decrement: 1 } } });
            return { upvoted: false };
        } else {
            await prisma.answerUpvote.create({ data: { userId, answerId } });
            await prisma.answer.update({ where: { id: answerId }, data: { upvotes: { increment: 1 } } });
            return { upvoted: true };
        }
    }

    // --- CERTIFICATES ---
    static async checkCertificateEligibility(userId: string, courseId: string) {
        const enrollment = await prisma.enrollment.findUnique({
             where: { userId_courseId: { userId, courseId } },
             include: { course: true }
        });

        if (!enrollment || enrollment.status !== 'ACTIVE') return { eligible: false };

        const totalLectures = await prisma.lecture.count({
            where: { section: { courseId } }
        });

        const completedLectures = await prisma.lectureProgress.count({
            where: { enrollmentId: enrollment.id, isCompleted: true }
        });

        if (totalLectures > 0 && completedLectures === totalLectures) {
            const lastCompleted = await prisma.lectureProgress.findFirst({
                 where: { enrollmentId: enrollment.id, isCompleted: true },
                 orderBy: { completedAt: 'desc' }
            });
            return {
                 eligible: true, 
                 studentName: await prisma.profile.findUnique({where: {userId}}).then(p => p?.displayName || 'Student'),
                 courseName: enrollment.course.title,
                 completedAt: lastCompleted?.completedAt?.toISOString() || new Date().toISOString()
            };
        }

        return { eligible: false };
    }
}
