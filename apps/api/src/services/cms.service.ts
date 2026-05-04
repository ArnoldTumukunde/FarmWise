import { prisma } from '@farmwise/db';
import sanitizeHtml from 'sanitize-html';

export class CmsService {
    // ─── PLATFORM CONFIG (key-value) ──────────────────────────────

    static async getSettings(): Promise<Record<string, any>> {
        const rows = await prisma.platformConfig.findMany();
        const map: Record<string, any> = {};
        for (const r of rows) {
            try { map[r.key] = JSON.parse(r.value); } catch { map[r.key] = r.value; }
        }

        // Return structured settings with defaults for anything not in DB
        return {
            general: {
                platformName: map['general.platformName'] ?? 'AAN Academy',
                tagline: map['general.tagline'] ?? 'Empowering Agricultural Learning',
                supportEmail: map['general.supportEmail'] ?? 'support@aan.academy',
            },
            payments: {
                // Default cut for instructors. Per-course override lives on Course.instructorSharePercent.
                // Always snapshot onto Enrollment.instructorSharePercent at purchase time so admin
                // changes here never shift recorded earnings retroactively.
                defaultInstructorSharePercent: map['payments.defaultInstructorSharePercent'] ?? 70,
                minPayoutThreshold: map['payments.minPayoutThreshold'] ?? 50000,
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

    static async updateSettings(section: string, data: Record<string, any>): Promise<void> {
        const ops = Object.entries(data).map(([field, value]) => {
            const key = `${section}.${field}`;
            const val = JSON.stringify(value);
            return prisma.platformConfig.upsert({
                where: { key },
                update: { value: val },
                create: { key, value: val },
            });
        });
        await Promise.all(ops);
    }

    // ─── HOMEPAGE SECTIONS ────────────────────────────────────────

    static async getHomepageSections() {
        return prisma.homepageSection.findMany({ orderBy: { order: 'asc' } });
    }

    static async updateHomepageSection(key: string, data: { enabled?: boolean; order?: number; config?: any }) {
        return prisma.homepageSection.update({
            where: { key },
            data: {
                ...(data.enabled !== undefined && { enabled: data.enabled }),
                ...(data.order !== undefined && { order: data.order }),
                ...(data.config !== undefined && { config: data.config }),
            },
        });
    }

    static async reorderHomepageSections(orderedKeys: string[]) {
        const ops = orderedKeys.map((key, index) =>
            prisma.homepageSection.update({ where: { key }, data: { order: index } })
        );
        await prisma.$transaction(ops);
    }

    // ─── STATIC PAGES ─────────────────────────────────────────────

    static async listPages(includeUnpublished = false) {
        const where = includeUnpublished ? {} : { isPublished: true };
        return prisma.page.findMany({ where, orderBy: { updatedAt: 'desc' } });
    }

    static async getPage(slug: string) {
        return prisma.page.findUnique({ where: { slug } });
    }

    static async getPageById(id: string) {
        return prisma.page.findUnique({ where: { id } });
    }

    static async createPage(data: { slug: string; title: string; content: string; isPublished?: boolean; metaTitle?: string; metaDesc?: string }) {
        return prisma.page.create({
            data: {
                slug: data.slug,
                title: data.title,
                content: sanitizeHtml(data.content, sanitizeOptions),
                isPublished: data.isPublished ?? false,
                metaTitle: data.metaTitle,
                metaDesc: data.metaDesc,
            },
        });
    }

    static async updatePage(id: string, data: { slug?: string; title?: string; content?: string; isPublished?: boolean; metaTitle?: string; metaDesc?: string }) {
        const updateData: any = {};
        if (data.slug !== undefined) updateData.slug = data.slug;
        if (data.title !== undefined) updateData.title = data.title;
        if (data.content !== undefined) updateData.content = sanitizeHtml(data.content, sanitizeOptions);
        if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
        if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
        if (data.metaDesc !== undefined) updateData.metaDesc = data.metaDesc;

        return prisma.page.update({ where: { id }, data: updateData });
    }

    static async deletePage(id: string) {
        return prisma.page.delete({ where: { id } });
    }

    // ─── AUDIT LOG ────────────────────────────────────────────────

    static async log(adminId: string, action: string, entity?: string, entityId?: string, details?: any, ipAddress?: string) {
        return prisma.auditLog.create({
            data: { adminId, action, entity, entityId, details, ipAddress },
        });
    }

    static async getAuditLogs(page = 1, limit = 50, filters?: { action?: string; adminId?: string; entity?: string }) {
        const skip = (page - 1) * limit;
        const where: any = {};
        if (filters?.action) where.action = filters.action;
        if (filters?.adminId) where.adminId = filters.adminId;
        if (filters?.entity) where.entity = filters.entity;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                include: { admin: { select: { email: true, profile: { select: { displayName: true } } } } },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.auditLog.count({ where }),
        ]);

        return { logs, total, page, totalPages: Math.ceil(total / limit) };
    }
}

const sanitizeOptions: sanitizeHtml.IOptions = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'iframe']),
    allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'width', 'height'],
        a: ['href', 'target', 'rel'],
        iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
};
