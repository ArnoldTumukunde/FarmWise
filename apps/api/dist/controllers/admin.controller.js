"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = exports.updateSettings = exports.getSettings = exports.sendBroadcast = exports.getBroadcasts = exports.getRevenue = exports.rejectRefund = exports.approveRefund = exports.getRefunds = exports.deleteCoupon = exports.updateCoupon = exports.createCoupon = exports.getCoupons = exports.getQuestionsModeration = exports.getReviewsModeration = exports.getUserById = exports.moderateReview = exports.getFlaggedReviews = exports.toggleFeatured = exports.moderateCourse = exports.getCoursesForReview = exports.deleteReview = exports.unpublishCourse = exports.deleteCourse = exports.listAllCourses = exports.deleteUser = exports.suspendUser = exports.updateUserRole = exports.reviewApplication = exports.getApplications = exports.getUsers = exports.getDashboard = void 0;
const admin_service_1 = require("../services/admin.service");
const cms_service_1 = require("../services/cms.service");
const getDashboard = async (req, res) => {
    try {
        const kpis = await admin_service_1.AdminService.getDashboardKPIs();
        res.json(kpis);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getDashboard = getDashboard;
const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const result = await admin_service_1.AdminService.listUsers(page);
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getUsers = getUsers;
const getApplications = async (req, res) => {
    try {
        const status = req.query.status;
        const apps = await admin_service_1.AdminService.getInstructorApplications(status);
        res.json({ applications: apps });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getApplications = getApplications;
const reviewApplication = async (req, res) => {
    try {
        const { action, note } = req.body;
        const app = await admin_service_1.AdminService.reviewInstructorApplication(req.user.id, req.params.id, action, note);
        await cms_service_1.CmsService.log(req.user.id, `application.${action.toLowerCase()}`, 'InstructorApplication', req.params.id, { action, note }, req.ip);
        res.json({ application: app });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.reviewApplication = reviewApplication;
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await admin_service_1.AdminService.updateUserRole(req.params.id, role);
        await cms_service_1.CmsService.log(req.user.id, 'user.updateRole', 'User', req.params.id, { role }, req.ip);
        res.json({ user });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.updateUserRole = updateUserRole;
const suspendUser = async (req, res) => {
    try {
        const { suspended } = req.body;
        const user = await admin_service_1.AdminService.suspendUser(req.params.id, suspended);
        res.json({ user });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.suspendUser = suspendUser;
const deleteUser = async (req, res) => {
    try {
        await admin_service_1.AdminService.deleteUser(req.params.id);
        res.json({ message: 'User deleted successfully' });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.deleteUser = deleteUser;
const listAllCourses = async (req, res) => {
    try {
        const { status, search, page } = req.query;
        const result = await admin_service_1.AdminService.listAllCourses({
            status: status,
            search: search,
            page: parseInt(page) || 1
        });
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.listAllCourses = listAllCourses;
const deleteCourse = async (req, res) => {
    try {
        await admin_service_1.AdminService.deleteCourse(req.params.id);
        res.json({ message: 'Course deleted successfully' });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.deleteCourse = deleteCourse;
const unpublishCourse = async (req, res) => {
    try {
        const course = await admin_service_1.AdminService.unpublishCourse(req.params.id);
        res.json({ course });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.unpublishCourse = unpublishCourse;
const deleteReview = async (req, res) => {
    try {
        await admin_service_1.AdminService.deleteReview(req.params.id);
        res.json({ message: 'Review deleted successfully' });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.deleteReview = deleteReview;
const getCoursesForReview = async (req, res) => {
    try {
        const courses = await admin_service_1.AdminService.listCoursesForReview();
        res.json({ courses });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getCoursesForReview = getCoursesForReview;
const moderateCourse = async (req, res) => {
    try {
        const { action } = req.body;
        const course = await admin_service_1.AdminService.moderateCourse(req.params.id, action);
        await cms_service_1.CmsService.log(req.user.id, `course.moderate.${action.toLowerCase()}`, 'Course', req.params.id, { action }, req.ip);
        res.json({ course });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.moderateCourse = moderateCourse;
const toggleFeatured = async (req, res) => {
    try {
        const course = await admin_service_1.AdminService.toggleCourseFeatured(req.params.id, req.body.isFeatured);
        res.json({ course });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.toggleFeatured = toggleFeatured;
const getFlaggedReviews = async (req, res) => {
    try {
        const reviews = await admin_service_1.AdminService.listFlaggedReviews();
        res.json({ reviews });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getFlaggedReviews = getFlaggedReviews;
const moderateReview = async (req, res) => {
    try {
        const review = await admin_service_1.AdminService.hideReview(req.params.id, req.body.isHidden);
        await cms_service_1.CmsService.log(req.user.id, req.body.isHidden ? 'review.hide' : 'review.unhide', 'Review', req.params.id, { isHidden: req.body.isHidden }, req.ip);
        res.json({ review });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.moderateReview = moderateReview;
// --- SINGLE USER DETAIL ---
const getUserById = async (req, res) => {
    try {
        const user = await admin_service_1.AdminService.getUserById(req.params.id);
        res.json({ user });
    }
    catch (e) {
        res.status(404).json({ error: e.message });
    }
};
exports.getUserById = getUserById;
// --- REVIEWS MODERATION ---
const getReviewsModeration = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const result = await admin_service_1.AdminService.getReviewsForModeration(page);
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getReviewsModeration = getReviewsModeration;
// --- QUESTIONS MODERATION ---
const getQuestionsModeration = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const result = await admin_service_1.AdminService.getQuestionsForModeration(page);
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getQuestionsModeration = getQuestionsModeration;
// --- COUPONS ---
const getCoupons = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const result = await admin_service_1.AdminService.listCoupons(page);
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getCoupons = getCoupons;
const createCoupon = async (req, res) => {
    try {
        const coupon = await admin_service_1.AdminService.createCoupon(req.body);
        res.status(201).json({ coupon });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.createCoupon = createCoupon;
const updateCoupon = async (req, res) => {
    try {
        const coupon = await admin_service_1.AdminService.updateCoupon(req.params.id, req.body);
        res.json({ coupon });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.updateCoupon = updateCoupon;
const deleteCoupon = async (req, res) => {
    try {
        await admin_service_1.AdminService.deleteCoupon(req.params.id);
        res.json({ message: 'Coupon deleted successfully' });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.deleteCoupon = deleteCoupon;
// --- REFUNDS ---
const getRefunds = async (req, res) => {
    try {
        const status = req.query.status;
        const page = parseInt(req.query.page) || 1;
        const result = await admin_service_1.AdminService.listRefunds(status, page);
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getRefunds = getRefunds;
const approveRefund = async (req, res) => {
    try {
        const enrollment = await admin_service_1.AdminService.approveRefund(req.params.id);
        res.json({ enrollment });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.approveRefund = approveRefund;
const rejectRefund = async (req, res) => {
    try {
        const result = await admin_service_1.AdminService.rejectRefund(req.params.id);
        res.json(result);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.rejectRefund = rejectRefund;
// --- REVENUE ---
const getRevenue = async (req, res) => {
    try {
        const analytics = await admin_service_1.AdminService.getRevenueAnalytics();
        res.json(analytics);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getRevenue = getRevenue;
// --- BROADCASTS ---
const getBroadcasts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const result = await admin_service_1.AdminService.getBroadcastHistory(page);
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getBroadcasts = getBroadcasts;
const sendBroadcast = async (req, res) => {
    try {
        const title = req.body.title || req.body.subject;
        const body = req.body.body || req.body.message;
        const { link, recipients, channels } = req.body;
        if (!title || !body) {
            return res.status(400).json({ error: 'Title/subject and body/message are required' });
        }
        const result = await admin_service_1.AdminService.sendBroadcast(title, body, link, recipients, channels);
        await cms_service_1.CmsService.log(req.user.id, 'broadcast.send', 'Notification', undefined, { title, recipientCount: result.recipientCount, channels: result.channels }, req.ip);
        res.status(201).json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.sendBroadcast = sendBroadcast;
// --- SETTINGS ---
const getSettings = async (req, res) => {
    try {
        const settings = await admin_service_1.AdminService.getSettings();
        res.json(settings);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        const { section, data } = req.body;
        if (!section || !data)
            return res.status(400).json({ error: 'section and data are required' });
        const settings = await admin_service_1.AdminService.updateSettings(section, data);
        await cms_service_1.CmsService.log(req.user.id, `settings.update.${section}`, 'PlatformConfig', section, data, req.ip);
        res.json(settings);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.updateSettings = updateSettings;
// --- CATEGORIES ---
const getCategories = async (req, res) => {
    try {
        const categories = await admin_service_1.AdminService.listCategories();
        res.json({ categories });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getCategories = getCategories;
const createCategory = async (req, res) => {
    try {
        const category = await admin_service_1.AdminService.createCategory(req.body);
        res.status(201).json({ category });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    try {
        const category = await admin_service_1.AdminService.updateCategory(req.params.id, req.body);
        res.json({ category });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        await admin_service_1.AdminService.deleteCategory(req.params.id);
        res.json({ message: 'Category deleted successfully' });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.deleteCategory = deleteCategory;
