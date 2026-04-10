"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
const db_1 = require("@farmwise/db");
const getNotifications = async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 20;
        const offset = Number(req.query.offset) || 0;
        const notifications = await db_1.prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
        const total = await db_1.prisma.notification.count({ where: { userId: req.user.id } });
        res.json({ notifications, total });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getNotifications = getNotifications;
const getUnreadCount = async (req, res) => {
    try {
        const count = await db_1.prisma.notification.count({
            where: { userId: req.user.id, isRead: false },
        });
        res.json({ count });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getUnreadCount = getUnreadCount;
const markAsRead = async (req, res) => {
    try {
        await db_1.prisma.notification.updateMany({
            where: { id: req.params.id, userId: req.user.id },
            data: { isRead: true },
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        await db_1.prisma.notification.updateMany({
            where: { userId: req.user.id, isRead: false },
            data: { isRead: true },
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.markAllAsRead = markAllAsRead;
const deleteNotification = async (req, res) => {
    try {
        await db_1.prisma.notification.deleteMany({
            where: { id: req.params.id, userId: req.user.id },
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteNotification = deleteNotification;
