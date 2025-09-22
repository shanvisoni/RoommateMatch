import prisma from '../config/database';

export interface CreateConnectionData {
  requesterId: number;
  receiverId: number;
}

export interface UpdateConnectionData {
  status: 'pending' | 'accepted' | 'rejected';
}

export interface Connection {
  id: number;
  requesterId: number;
  receiverId: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  requester?: {
    id: number;
    email: string;
    profile?: {
      id: number;
      name: string;
      profilePhotoUrl?: string;
    };
  };
  receiver?: {
    id: number;
    email: string;
    profile?: {
      id: number;
      name: string;
      profilePhotoUrl?: string;
    };
  };
}

export const connectionModel = {
  async create(data: CreateConnectionData): Promise<Connection> {
    const connection = await prisma.connection.create({
      data: {
        requesterId: data.requesterId,
        receiverId: data.receiverId,
      },
      include: {
        requester: {
          include: {
            profile: true,
          },
        },
        receiver: {
          include: {
            profile: true,
          },
        },
      },
    });

    return connection as Connection;
  },

  async findByRequesterId(requesterId: number): Promise<Connection[]> {
    const connections = await prisma.connection.findMany({
      where: { requesterId },
      include: {
        requester: {
          include: {
            profile: true,
          },
        },
        receiver: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return connections as Connection[];
  },

  async findByReceiverId(receiverId: number): Promise<Connection[]> {
    const connections = await prisma.connection.findMany({
      where: { receiverId },
      include: {
        requester: {
          include: {
            profile: true,
          },
        },
        receiver: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return connections as Connection[];
  },

  async findByUserAndTarget(userId: number, targetUserId: number): Promise<Connection | null> {
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: userId, receiverId: targetUserId },
          { requesterId: targetUserId, receiverId: userId },
        ],
      },
      include: {
        requester: {
          include: {
            profile: true,
          },
        },
        receiver: {
          include: {
            profile: true,
          },
        },
      },
    });

    return connection as Connection | null;
  },

  async update(id: number, data: UpdateConnectionData): Promise<Connection> {
    const connection = await prisma.connection.update({
      where: { id },
      data: {
        status: data.status,
      },
      include: {
        requester: {
          include: {
            profile: true,
          },
        },
        receiver: {
          include: {
            profile: true,
          },
        },
      },
    });

    return connection as Connection;
  },

  async delete(id: number): Promise<void> {
    await prisma.connection.delete({
      where: { id },
    });
  },

  async getConnectionStatus(userId: number, targetUserId: number): Promise<string | null> {
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: userId, receiverId: targetUserId },
          { requesterId: targetUserId, receiverId: userId },
        ],
      },
    });

    return connection?.status || null;
  },
};
