"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Walk up from cwd to find .env (handles tsx, ts-node, and direct node)
function findEnv() {
    let dir = process.cwd();
    for (let i = 0; i < 5; i++) {
        const candidate = path_1.default.join(dir, '.env');
        if (fs_1.default.existsSync(candidate))
            return candidate;
        dir = path_1.default.dirname(dir);
    }
    return '.env'; // fallback
}
dotenv_1.default.config({ path: findEnv() });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const course_routes_1 = __importDefault(require("./routes/course.routes"));
const instructor_routes_1 = __importDefault(require("./routes/instructor.routes"));
const media_routes_1 = __importDefault(require("./routes/media.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const enrollment_routes_1 = __importDefault(require("./routes/enrollment.routes"));
const learn_routes_1 = __importDefault(require("./routes/learn.routes"));
const community_routes_1 = __importDefault(require("./routes/community.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const wishlist_routes_1 = __importDefault(require("./routes/wishlist.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const stats_routes_1 = __importDefault(require("./routes/stats.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const farmer_routes_1 = __importDefault(require("./routes/farmer.routes"));
const pages_routes_1 = __importDefault(require("./routes/pages.routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express_1.default.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use((0, cookie_parser_1.default)());
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/courses', course_routes_1.default);
app.use('/api/v1/instructor', instructor_routes_1.default);
app.use('/api/v1/media', media_routes_1.default);
app.use('/api/v1/payments', payment_routes_1.default);
app.use('/api/v1/enrollments', enrollment_routes_1.default);
app.use('/api/v1/learn', learn_routes_1.default);
app.use('/api/v1/community', community_routes_1.default);
app.use('/api/v1/reviews', review_routes_1.default);
app.use('/api/v1/admin', admin_routes_1.default);
app.use('/api/v1/cart', cart_routes_1.default);
app.use('/api/v1/wishlist', wishlist_routes_1.default);
app.use('/api/v1/enrollments/wishlist', wishlist_routes_1.default);
app.use('/api/v1/profile', profile_routes_1.default);
app.use('/api/v1/stats', stats_routes_1.default);
app.use('/api/v1/notifications', notification_routes_1.default);
app.use('/api/v1/farmer', farmer_routes_1.default);
app.use('/api/v1/pages', pages_routes_1.default);
// Start BullMQ notification worker
Promise.resolve().then(() => __importStar(require('./jobs/worker'))).then(() => {
    console.log('Notification worker started');
}).catch(err => {
    console.warn('Notification worker failed to start (Redis may be unavailable):', err.message);
});
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
