import { prisma, Course, Section, Lecture, Prisma } from '@farmwise/db';
import { sanitizeRichText } from '../utils/sanitize';

export class InstructorService {
  static async listInstructorCourses(instructorId: string) {
    return prisma.course.findMany({
      where: { instructorId },
      include: {
        category: true,
        _count: { select: { enrollments: true, reviews: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createCourse(instructorId: string, data: { title: string; categoryId: string }) {
    // Generate a slug from the title
    const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    
    // Robust unique slug generation
    let isUnique = false;
    while (!isUnique) {
      const existing = await prisma.course.findUnique({ where: { slug } });
      if (!existing) {
        isUnique = true;
      } else {
        const randomStr = Math.random().toString(36).substring(2, 8);
        slug = `${baseSlug}-${randomStr}`;
      }
    }

    return prisma.course.create({
      data: {
        title: data.title,
        slug,
        description: '',
        categoryId: data.categoryId,
        instructorId,
      }
    });
  }

  static async getCourseDraft(instructorId: string, courseId: string) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, instructorId },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            lectures: { orderBy: { order: 'asc' } }
          }
        }
      }
    });
    if (!course) throw new Error('Course not found or access denied');
    return course;
  }

  static async updateCourse(instructorId: string, courseId: string, data: Prisma.CourseUpdateInput) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.instructorId !== instructorId) {
      throw new Error('Course not found or access denied');
    }
    
    if (typeof data.description === 'string') {
      data.description = sanitizeRichText(data.description);
    }
    
    return prisma.course.update({
      where: { id: courseId },
      data
    });
  }

  static async createSection(instructorId: string, courseId: string, title: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId }, include: { sections: true } });
    if (!course || course.instructorId !== instructorId) throw new Error('Access denied');
    
    const order = course.sections.length;
    return prisma.section.create({
      data: { courseId, title, order }
    });
  }

  static async createLecture(instructorId: string, sectionId: string, title: string, type: 'VIDEO' | 'ARTICLE' | 'QUIZ') {
    const section = await prisma.section.findUnique({ where: { id: sectionId }, include: { course: true, lectures: true } });
    if (!section || section.course.instructorId !== instructorId) throw new Error('Access denied');

    const order = section.lectures.length;
    return prisma.lecture.create({
      data: { sectionId, title, type, order }
    });
  }
}
