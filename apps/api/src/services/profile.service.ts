import { prisma } from '@farmwise/db';

export class ProfileService {
  /**
   * Get the current user's full profile.
   */
  static async getMyProfile(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    // Fetch user's email and phone so the frontend can display them
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true },
    });

    if (!profile) {
      // Auto-create a minimal profile if none exists
      const created = await prisma.profile.create({
        data: { userId, displayName: 'User' },
      });
      return { ...created, email: user?.email ?? null, phone: user?.phone ?? null };
    }

    return { ...profile, email: user?.email ?? null, phone: user?.phone ?? null };
  }

  /**
   * Update the current user's profile.
   */
  static async updateMyProfile(
    userId: string,
    data: {
      displayName?: string;
      headline?: string;
      bio?: string;
      farmLocation?: string;
      cropSpecialities?: string[];
      farmSize?: string;
      yearsExperience?: number | null;
      website?: string;
      avatarPublicId?: string;
    }
  ) {
    return prisma.profile.upsert({
      where: { userId },
      update: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.headline !== undefined && { headline: data.headline }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.farmLocation !== undefined && { farmLocation: data.farmLocation }),
        ...(data.cropSpecialities !== undefined && { cropSpecialities: data.cropSpecialities }),
        ...(data.farmSize !== undefined && { farmSize: data.farmSize }),
        ...(data.yearsExperience !== undefined && { yearsExperience: data.yearsExperience }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.avatarPublicId !== undefined && { avatarPublicId: data.avatarPublicId }),
      },
      create: {
        userId,
        displayName: data.displayName || 'User',
        headline: data.headline,
        bio: data.bio,
        farmLocation: data.farmLocation,
        cropSpecialities: data.cropSpecialities || [],
        farmSize: data.farmSize,
        yearsExperience: data.yearsExperience,
        website: data.website,
        avatarPublicId: data.avatarPublicId,
      },
    });
  }

  /**
   * Get another user's public profile (limited fields).
   */
  static async getPublicProfile(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        displayName: true,
        headline: true,
        bio: true,
        avatarPublicId: true,
        farmLocation: true,
        cropSpecialities: true,
        website: true,
      },
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Also fetch user role for context (e.g., instructor badge)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, createdAt: true },
    });

    return {
      ...profile,
      role: user?.role,
      memberSince: user?.createdAt,
    };
  }
}
