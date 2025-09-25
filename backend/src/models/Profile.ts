import prisma from '../config/database';

export interface CreateProfileData {
  userId: number;
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
  drinking?: string;
  pets?: boolean;
  cleanliness?: string;
  socialLevel?: string;
  workFromHome?: boolean;
  guests?: string;
  music?: string;
  cooking?: string;
}

export interface UpdateProfileData {
  name?: string;
  age?: number;
  bio?: string;
  location?: string;
  profilePhotoUrl?: string;
  gender?: string;
  profession?: string;
  budget?: number;
  moveInDate?: Date;
  smoking?: boolean;
  drinking?: string;
  pets?: boolean;
  cleanliness?: string;
  socialLevel?: string;
  workFromHome?: boolean;
  guests?: string;
  music?: string;
  cooking?: string;
}

export class ProfileModel {
  static async create(profileData: CreateProfileData) {
    return await prisma.profile.create({
      data: profileData,
    });
  }

  static async findByUserId(userId: number) {
    return await prisma.profile.findUnique({
      where: { userId },
    });
  }

  static async findById(id: number) {
    return await prisma.profile.findUnique({
      where: { id },
    });
  }

  static async findAll() {
    return await prisma.profile.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findAllExceptUserId(userId: number) {
    const profiles = await prisma.profile.findMany({
      where: {
        userId: {
          not: userId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    console.log('🔍 Database profiles found:', profiles.length);
    console.log('📸 Database profile photo URLs:', profiles.slice(0, 3).map(p => ({ name: p.name, profilePhotoUrl: p.profilePhotoUrl })));
    return profiles;
  }

  static async update(userId: number, updateData: UpdateProfileData) {
    return await prisma.profile.update({
      where: { userId },
      data: updateData,
    });
  }

  static async delete(userId: number): Promise<void> {
    await prisma.profile.delete({
      where: { userId },
    });
  }
}
