import prisma from '../config/database';

export interface CreateSavedProfileData {
  userId: number;
  profileId: number;
}

export interface SavedProfile {
  id: number;
  userId: number;
  profileId: number;
  createdAt: Date;
  profile?: {
    id: number;
    name: string;
    age: number;
    bio: string;
    location: string;
    profilePhotoUrl?: string;
    gender?: string;
    profession?: string;
    budget?: number;
    moveInDate?: Date;
    smoking?: boolean;
    pets?: boolean;
    cleanliness?: string;
    socialLevel?: string;
    workFromHome?: boolean;
    guests?: string;
    music?: string;
    cooking?: string;
  };
}

export const savedProfileModel = {
  async create(data: CreateSavedProfileData): Promise<SavedProfile> {
    const savedProfile = await prisma.savedProfile.create({
      data: {
        userId: data.userId,
        profileId: data.profileId,
      },
      include: {
        profile: true,
      },
    });

    return savedProfile as SavedProfile;
  },

  async findByUserId(userId: number): Promise<SavedProfile[]> {
    const savedProfiles = await prisma.savedProfile.findMany({
      where: { userId },
      include: {
        profile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return savedProfiles as SavedProfile[];
  },

  async findByUserAndProfile(userId: number, profileId: number): Promise<SavedProfile | null> {
    const savedProfile = await prisma.savedProfile.findUnique({
      where: {
        userId_profileId: {
          userId,
          profileId,
        },
      },
      include: {
        profile: true,
      },
    });

    return savedProfile as SavedProfile | null;
  },

  async delete(userId: number, profileId: number): Promise<void> {
    await prisma.savedProfile.delete({
      where: {
        userId_profileId: {
          userId,
          profileId,
        },
      },
    });
  },

  async isSaved(userId: number, profileId: number): Promise<boolean> {
    const savedProfile = await prisma.savedProfile.findUnique({
      where: {
        userId_profileId: {
          userId,
          profileId,
        },
      },
    });

    return !!savedProfile;
  },
};
