"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsService = void 0;
const db_1 = require("@farmwise/db");
const sanitize_html_1 = __importDefault(require("sanitize-html"));
class CmsService {
    // ─── PLATFORM CONFIG (key-value) ──────────────────────────────
    static async getSettings() {
        const rows = await db_1.prisma.platformConfig.findMany();
        const map = {};
        for (const r of rows) {
            try {
                map[r.key] = JSON.parse(r.value);
            }
            catch {
                map[r.key] = r.value;
            }
        }
        // Return structured settings with defaults for anything not in DB
        return {
            general: {
                platformName: map['general.platformName'] ?? 'FarmWise',
                tagline: map['general.tagline'] ?? 'Growing Knowledge, Growing Harvests',
                supportEmail: map['general.supportEmail'] ?? 'support@farmwise.co',
            },
            payments: {
                platformFeePercent: map['payments.platformFeePercent'] ?? 30,
                minPayoutThreshold: map['payments.minPayoutThreshold'] ?? 50000,
                autoPayoutEnabled: map['payments.autoPayoutEnabled'] ?? false,
            },
            content: {
                minLecturesPerCourse: map['content.minLecturesPerCourse'] ?? 5,
                minLectureDuration: map['content.minLectureDuration'] ?? 120,
            },
            features: {
                certificates_enabled: map['features.certificates_enabled'] ?? true,
                qa_enabled: map['features.qa_enabled'] ?? true,
                offline_downloads_enabled: map['features.offline_downloads_enabled'] ?? true,
                reviews_enabled: map['features.reviews_enabled'] ?? true,
                coupons_enabled: map['features.coupons_enabled'] ?? true,
                sms_notifications_enabled: map['features.sms_notifications_enabled'] ?? true,
            },
        };
    }
    static async updateSettings(section, data) {
        const ops = Object.entries(data).map(([field, value]) => {
            const key = `${section}.${field}`;
            const val = JSON.stringify(value);
            return db_1.prisma.platformConfig.upsert({
                where: { key },
                update: { value: val },
                create: { key, value: val },
            });
        });
        await Promise.all(ops);
    }
    // ─── HOMEPAGE SECTIONS ────────────────────────────────────────
    static async getHomepageSections() {
        return db_1.prisma.homepageSection.findMany({ orderBy: { order: 'asc' } });
    }
    static async updateHomepageSection(key, data) {
        return db_1.prisma.homepageSection.update({
            where: { key },
            data: {
                ...(data.enabled !== undefined && { enabled: data.enabled }),
                ...(data.order !== undefined && { order: data.order }),
                ...(data.config !== undefined && { config: data.config }),
            },
        });
    }
    static async reorderHomepageSections(orderedKeys) {
        const ops = orderedKeys.map((key, index) => db_1.prisma.homepageSection.update({ where: { key }, data: { order: index } }));
        await db_1.prisma.$transaction(ops);
    }
    // ─── STATIC PAGES ─────────────────────────────────────────────
    static async listPages(includeUnpublished = false) {
        const where = includeUnpublished ? {} : { isPublished: true };
        return db_1.prisma.page.findMany({ where, orderBy: { updatedAt: 'desc' } });
    }
    static async getPage(slug) {
        return db_1.prisma.page.findUnique({ where: { slug } });
    }
    static async getPageById(id) {
        return db_1.prisma.page.findUnique({ where: { id } });
    }
    static async createPage(data) {
        return db_1.prisma.page.create({
            data: {
                slug: data.slug,
                title: data.title,
                content: (0, sanitize_html_1.default)(data.content, sanitizeOptions),
                isPublished: data.isPublished ?? false,
                metaTitle: data.metaTitle,
                metaDesc: data.metaDesc,
            },
        });
    }
    static async updatePage(id, data) {
        const updateData = {};
        if (data.slug !== undefined)
            updateData.slug = data.slug;
        if (data.title !== undefined)
            updateData.title = data.title;
        if (data.content !== undefined)
            updateData.content = (0, sanitize_html_1.default)(data.content, sanitizeOptions);
        if (data.isPublished !== undefined)
            updateData.isPublished = data.isPublished;
        if (data.metaTitle !== undefined)
            updateData.metaTitle = data.metaTitle;
        if (data.metaDesc !== undefined)
            updateData.metaDesc = data.metaDesc;
        return db_1.prisma.page.update({ where: { id }, data: updateData });
    }
    static async deletePage(id) {
        return db_1.prisma.page.delete({ where: { id } });
    }
    // ─── AUDIT LOG ────────────────────────────────────────────────
    static async log(adminId, action, entity, entityId, details, ipAddress) {
        return db_1.prisma.auditLog.create({
            data: { adminId, action, entity, entityId, details, ipAddress },
        });
    }
    static async getAuditLogs(page = 1, limit = 50, filters) {
        const skip = (page - 1) * limit;
        const where = {};
        if (filters?.action)
            where.action = filters.action;
        if (filters?.adminId)
            where.adminId = filters.adminId;
        if (filters?.entity)
            where.entity = filters.entity;
        const [logs, total] = await Promise.all([
            db_1.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                include: { admin: { select: { email: true, profile: { select: { displayName: true } } } } },
                orderBy: { createdAt: 'desc' },
            }),
            db_1.prisma.auditLog.count({ where }),
        ]);
        return { logs, total, page, totalPages: Math.ceil(total / limit) };
    }
}
exports.CmsService = CmsService;
const sanitizeOptions = {
    allowedTags: sanitize_html_1.default.defaults.allowedTags.concat(['img', 'h1', 'h2', 'iframe']),
    allowedAttributes: {
        ...sanitize_html_1.default.defaults.allowedAttributes,
        img: ['src', 'alt', 'width', 'height'],
        a: ['href', 'target', 'rel'],
        iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
};
