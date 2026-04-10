"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicStats = void 0;
const db_1 = require("@farmwise/db");
const getPublicStats = async (_req, res) => {
    try {
        const [farmerCount, courseCount, instructorCount] = await Promise.all([
            db_1.prisma.user.count({ where: { role: 'FARMER' } }),
            db_1.prisma.course.count({ where: { status: 'PUBLISHED' } }),
            db_1.prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
        ]);
        res.json({ farmerCount, courseCount, instructorCount });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getPublicStats = getPublicStats;
