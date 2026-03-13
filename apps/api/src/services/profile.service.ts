import { prisma } from '@farmwise/db';

export class ProfileService {
  /**
   * Get the current user's full profile.
   */
  static async getMyProfile(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // Auto-create a minimal profile if none exists
      return prisma.profile.create({
        data: { userId, displayName: 'User' },
      });
    }

    return profile;
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
      website?: string;
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
        ...(data.website !== undefined && { website: data.website }),
      },
      create: {
        userId,
        displayName: data.displayName || 'User',
        headline: data.headline,
        bio: data.bio,
        farmLocation: data.farmLocation,
        cropSpecialities: data.cropSpecialities || [],
        website: data.website,
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
