import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AdminService } from '../services/admin.service';

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
        res.json({ application: app });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
    try {
        const { role } = req.body;
        const user = await AdminService.updateUserRole(req.params.id, role);
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
        const { action } = req.body;
        const course = await AdminService.moderateCourse(req.params.id, action);
        res.json({ course });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const toggleFeatured = async (req: AuthRequest, res: Response) => {
    try {
        const course = await AdminService.toggleCourseFeatured(req.params.id, req.body.isFeatured);
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
        res.json({ review });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};
