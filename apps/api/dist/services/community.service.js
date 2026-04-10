"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityService = void 0;
const db_1 = require("@farmwise/db");
class CommunityService {
    // --- NOTES ---
    static async getNotes(userId, lectureId) {
        return db_1.prisma.note.findMany({
            where: { userId, lectureId },
            orderBy: { timestamp: 'asc' }
        });
    }
    static async createNote(userId, lectureId, content, timestamp) {
        return db_1.prisma.note.create({
            data: { userId, lectureId, content, timestamp }
        });
    }
    static async deleteNote(userId, noteId) {
        return db_1.prisma.note.deleteMany({
            where: { id: noteId, userId }
        });
    }
    // --- Q&A ---
    static async getQuestions(lectureId) {
        return db_1.prisma.question.findMany({
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
    static async createQuestion(userId, lectureId, content) {
        return db_1.prisma.question.create({
            data: { userId, lectureId, content }
        });
    }
    static async createAnswer(userId, questionId, content) {
        return db_1.prisma.answer.create({
            data: { userId, questionId, content }
        });
    }
    static async upvoteAnswer(userId, answerId) {
        const existing = await db_1.prisma.answerUpvote.findUnique({
            where: { userId_answerId: { userId, answerId } }
        });
        if (existing) {
            await db_1.prisma.answerUpvote.delete({ where: { userId_answerId: { userId, answerId } } });
            await db_1.prisma.answer.update({ where: { id: answerId }, data: { upvotes: { decrement: 1 } } });
            return { upvoted: false };
        }
        else {
            await db_1.prisma.answerUpvote.create({ data: { userId, answerId } });
            await db_1.prisma.answer.update({ where: { id: answerId }, data: { upvotes: { increment: 1 } } });
            return { upvoted: true };
        }
    }
    // --- CERTIFICATES ---
    static async checkCertificateEligibility(userId, courseId) {
        const enrollment = await db_1.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
            include: { course: true }
        });
        if (!enrollment || enrollment.status !== 'ACTIVE')
            return { eligible: false };
        const totalLectures = await db_1.prisma.lecture.count({
            where: { section: { courseId } }
        });
        const completedLectures = await db_1.prisma.lectureProgress.count({
            where: { enrollmentId: enrollment.id, isCompleted: true }
        });
        if (totalLectures > 0 && completedLectures === totalLectures) {
            const lastCompleted = await db_1.prisma.lectureProgress.findFirst({
                where: { enrollmentId: enrollment.id, isCompleted: true },
                orderBy: { completedAt: 'desc' }
            });
            return {
                eligible: true,
                studentName: await db_1.prisma.profile.findUnique({ where: { userId } }).then(p => p?.displayName || 'Student'),
                courseName: enrollment.course.title,
                completedAt: lastCompleted?.completedAt?.toISOString() || new Date().toISOString()
            };
        }
        return { eligible: false };
    }
}
exports.CommunityService = CommunityService;
