import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AdminService } from '../services/admin.service';
import { CmsService } from '../services/cms.service';

export const getDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const kpis = await AdminService.getDashboardKPIs();
        res.json(kpis);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const result = await AdminService.listUsers(page);
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const getApplications = async (req: AuthRequest, res: Response) => {
    try {
        const status = req.query.status as any;
        const apps = await AdminService.getInstructorApplications(status);
        res.json({ applications: apps });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const reviewApplication = async (req: AuthRequest, res: Response) => {
    try {
        const { action, note } = req.body;
        const app = await AdminService.reviewInstructorApplication(req.user!.id, req.params.id, action, note);
        await CmsService.log(req.user!.id, `application.${action.toLowerCase()}`, 'InstructorApplication', req.params.id, { action, note }, req.ip);
        res.json({ application: app });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
    try {
        const { role } = req.body;
        const user = await AdminService.updateUserRole(req.params.id, role);
        await CmsService.log(req.user!.id, 'user.updateRole', 'User', req.params.id, { role }, req.ip);
        res.json({ user });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const suspendUser = async (req: AuthRequest, res: Response) => {
    try {
        const { suspended } = req.body;
        const user = await AdminService.suspendUser(req.params.id, suspended);
        res.json({ user });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        await AdminService.deleteUser(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const listAllCourses = async (req: AuthRequest, res: Response) => {
    try {
        const { status, search, page } = req.query;
        const result = await AdminService.listAllCourses({
            status: status as string,
            search: search as string,
            page: parseInt(page as string) || 1
        });
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const deleteCourse = async (req: AuthRequest, res: Response) => {
    try {
        await AdminService.deleteCourse(req.params.id);
        res.json({ message: 'Course deleted successfully' });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const unpublishCourse = async (req: AuthRequest, res: Response) => {
    try {
        const course = await AdminService.unpublishCourse(req.params.id);
        res.json({ course });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const publishCourse = async (req: AuthRequest, res: Response) => {
    try {
        const course = await AdminService.publishCourse(req.params.id);
        await CmsService.log(req.user!.id, 'course.publish', 'Course', req.params.id, {}, req.ip);
        res.json({ course });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const deleteReview = async (req: AuthRequest, res: Response) => {
    try {
        await AdminService.deleteReview(req.params.id);
        res.json({ message: 'Review deleted successfully' });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const getCoursesForReview = async (req: AuthRequest, res: Response) => {
    try {
        const courses = await AdminService.listCoursesForReview();
        res.json({ courses });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const moderateCourse = async (req: AuthRequest, res: Response) => {
    try {
        const { action, feedback } = req.body;
        const course = await AdminService.moderateCourse(req.params.id, action, feedback);
        await CmsService.log(req.user!.id, `course.moderate.${String(action).toLowerCase()}`, 'Course', req.params.id, { action, feedback }, req.ip);
        res.json({ course });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const toggleFeatured = async (req: AuthRequest, res: Response) => {
    try {
        const course = await AdminService.toggleCourseFeatured(req.params.id, req.body.isFeatured);
        res.json({ course });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const setSponsored = async (req: AuthRequest, res: Response) => {
    try {
        const course = await AdminService.setSponsored(req.params.id, req.body.sponsoredUntil);
        res.json({ course });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const getFlaggedReviews = async (req: AuthRequest, res: Response) => {
    try {
        const reviews = await AdminService.listFlaggedReviews();
        res.json({ reviews });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const moderateReview = async (req: AuthRequest, res: Response) => {
    try {
        const review = await AdminService.hideReview(req.params.id, req.body.isHidden);
        await CmsService.log(req.user!.id, req.body.isHidden ? 'review.hide' : 'review.unhide', 'Review', req.params.id, { isHidden: req.body.isHidden }, req.ip);
        res.json({ review });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

// --- SINGLE USER DETAIL ---
export const getUserById = async (req: AuthRequest, res: Response) => {
    try {
        const user = await AdminService.getUserById(req.params.id);
        res.json({ user });
    } catch (e: any) { res.status(404).json({ error: e.message }); }
};

// --- REVIEWS MODERATION ---
export const getReviewsModeration = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const result = await AdminService.getReviewsForModeration(page);
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

// --- QUESTIONS MODERATION ---
export const getQuestionsModeration = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const result = await AdminService.getQuestionsForModeration(page);
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

// --- COUPONS ---
export const getCoupons = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const result = await AdminService.listCoupons(page);
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const createCoupon = async (req: AuthRequest, res: Response) => {
    try {
        const coupon = await AdminService.createCoupon(req.body);
        res.status(201).json({ coupon });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const updateCoupon = async (req: AuthRequest, res: Response) => {
    try {
        const coupon = await AdminService.updateCoupon(req.params.id, req.body);
        res.json({ coupon });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const deleteCoupon = async (req: AuthRequest, res: Response) => {
    try {
        await AdminService.deleteCoupon(req.params.id);
        res.json({ message: 'Coupon deleted successfully' });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
};

// --- REFUNDS ---
export const getRefunds = async (req: AuthRequest, res: Response) => {
    try {
        const status = req.query.status as string | undefined;
        const page = parseInt(req.query.page as string) || 1;
        const result = await AdminService.listRefunds(status, page);
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const approveRefund = async (req: AuthRequest, res: Response) => {
    try {
        const enrollment = await AdminService.approveRefund(req.params.id);
        res.json({ enrollment });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const rejectRefund = async (req: AuthRequest, res: Response) => {
    try {
        const result = await AdminService.rejectRefund(req.params.id);
        res.json(result);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
};

// --- REVENUE ---
export const getRevenue = async (req: AuthRequest, res: Response) => {
    try {
        const analytics = await AdminService.getRevenueAnalytics();
        res.json(analytics);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

// --- BROADCASTS ---
export const getBroadcasts = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const result = await AdminService.getBroadcastHistory(page);
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const sendBroadcast = async (req: AuthRequest, res: Response) => {
    try {
        const title = req.body.title || req.body.subject;
        const body = req.body.body || req.body.message;
        const { link, recipients, channels } = req.body;
        if (!title || !body) {
            return res.status(400).json({ error: 'Title/subject and body/message are required' });
        }
        const result = await AdminService.sendBroadcast(title, body, link, recipients, channels);
        await CmsService.log(req.user!.id, 'broadcast.send', 'Notification', undefined, { title, recipientCount: result.recipientCount, channels: result.channels }, req.ip);
        res.status(201).json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

// --- SETTINGS ---
export const getSettings = async (req: AuthRequest, res: Response) => {
    try {
        const settings = await AdminService.getSettings();
        res.json(settings);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
    try {
        const { section, data } = req.body;
        if (!section || !data) return res.status(400).json({ error: 'section and data are required' });
        const settings = await AdminService.updateSettings(section, data);
        await CmsService.log(req.user!.id, `settings.update.${section}`, 'PlatformConfig', section, data, req.ip);
        res.json(settings);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

// --- CATEGORIES ---
export const getCategories = async (req: AuthRequest, res: Response) => {
    try {
        const categories = await AdminService.listCategories();
        res.json({ categories });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
    try {
        const category = await AdminService.createCategory(req.body);
        res.status(201).json({ category });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
    try {
        const category = await AdminService.updateCategory(req.params.id, req.body);
        res.json({ category });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
    try {
        await AdminService.deleteCategory(req.params.id);
        res.json({ message: 'Category deleted successfully' });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
};
