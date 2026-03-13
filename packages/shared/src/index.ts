export type Role = 'FARMER' | 'INSTRUCTOR' | 'ADMIN';
export type CourseStatus = 'DRAFT' | 'UNDER_REVIEW' | 'PUBLISHED' | 'UNPUBLISHED';
export type Level = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type LectureType = 'VIDEO' | 'ARTICLE' | 'QUIZ';
export type VideoStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
export type EnrollmentStatus = 'PENDING' | 'ACTIVE' | 'REFUNDED';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type DownloadStatus = 'DOWNLOADED' | 'DELETED';
export type NotificationType = 'ENROLLMENT_CONFIRMED' | 'REVIEW_RECEIVED' | 'REVIEW_RESPONSE' | 'REFUND_APPROVED' | 'COURSE_APPROVED' | 'COURSE_REJECTED' | 'PAYOUT_PROCESSED' | 'QA_ANSWER' | 'CERTIFICATE_EARNED' | 'ANNOUNCEMENT' | 'INSTRUCTOR_APPLICATION_REVIEWED';

export interface User { id: string; role: Role; email?: string; phone?: string; }
export interface Profile { displayName: string; headline?: string; bio?: string; avatarPublicId?: string; }
export interface CourseCard { id: string; slug: string; title: string; subtitle?: string; price: string; level: Level; thumbnailPublicId?: string; isFeatured: boolean; averageRating: string; reviewCount: number; enrollmentCount: number; category: { name: string }; instructor: { profile: { displayName: string } }; _count: { sections: number; enrollments: number }; }
export interface Lecture { id: string; title: string; order: number; type: LectureType; videoStatus: VideoStatus; hlsUrl?: string; duration?: number; fileSizeBytes?: number; isPreview: boolean; }
export interface Section { id: string; title: string; order: number; lectures: Lecture[]; }
