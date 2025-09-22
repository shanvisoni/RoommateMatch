import prisma from '../config/database';

export interface CreateFeedbackData {
  fromUserId: number;
  toUserId: number;
  rating: number;
  comment?: string;
  cleanliness?: number;
  communication?: number;
  reliability?: number;
}

export interface UpdateFeedbackData {
  rating?: number;
  comment?: string;
  cleanliness?: number;
  communication?: number;
  reliability?: number;
}

export interface Feedback {
  id: number;
  fromUserId: number;
  toUserId: number;
  rating: number;
  comment?: string;
  cleanliness?: number;
  communication?: number;
  reliability?: number;
  createdAt: Date;
  fromUser?: {
    id: number;
    email: string;
    profile?: {
      id: number;
      name: string;
      profilePhotoUrl?: string;
    };
  };
  toUser?: {
    id: number;
    email: string;
    profile?: {
      id: number;
      name: string;
      profilePhotoUrl?: string;
    };
  };
}

export const feedbackModel = {
  async create(data: CreateFeedbackData): Promise<Feedback> {
    const feedback = await prisma.feedback.create({
      data: {
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        rating: data.rating,
        comment: data.comment,
        cleanliness: data.cleanliness,
        communication: data.communication,
        reliability: data.reliability,
      },
      include: {
        fromUser: {
          include: {
            profile: true,
          },
        },
        toUser: {
          include: {
            profile: true,
          },
        },
      },
    });

    return feedback as Feedback;
  },

  async findByToUserId(toUserId: number): Promise<Feedback[]> {
    const feedbacks = await prisma.feedback.findMany({
      where: { toUserId },
      include: {
        fromUser: {
          include: {
            profile: true,
          },
        },
        toUser: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return feedbacks as Feedback[];
  },

  async findByFromUserId(fromUserId: number): Promise<Feedback[]> {
    const feedbacks = await prisma.feedback.findMany({
      where: { fromUserId },
      include: {
        fromUser: {
          include: {
            profile: true,
          },
        },
        toUser: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return feedbacks as Feedback[];
  },

  async findByFromAndToUser(fromUserId: number, toUserId: number): Promise<Feedback | null> {
    const feedback = await prisma.feedback.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId,
          toUserId,
        },
      },
      include: {
        fromUser: {
          include: {
            profile: true,
          },
        },
        toUser: {
          include: {
            profile: true,
          },
        },
      },
    });

    return feedback as Feedback | null;
  },

  async update(id: number, data: UpdateFeedbackData): Promise<Feedback> {
    const feedback = await prisma.feedback.update({
      where: { id },
      data: {
        rating: data.rating,
        comment: data.comment,
        cleanliness: data.cleanliness,
        communication: data.communication,
        reliability: data.reliability,
      },
      include: {
        fromUser: {
          include: {
            profile: true,
          },
        },
        toUser: {
          include: {
            profile: true,
          },
        },
      },
    });

    return feedback as Feedback;
  },

  async delete(id: number): Promise<void> {
    await prisma.feedback.delete({
      where: { id },
    });
  },

  async getAverageRating(userId: number): Promise<number> {
    const result = await prisma.feedback.aggregate({
      where: { toUserId: userId },
      _avg: {
        rating: true,
      },
    });

    return result._avg.rating || 0;
  },

  async getRatingCount(userId: number): Promise<number> {
    const count = await prisma.feedback.count({
      where: { toUserId: userId },
    });

    return count;
  },
};
