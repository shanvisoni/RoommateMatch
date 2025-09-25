import prisma from '../config/database';

export interface Match {
  id: number;
  user1_id: number;
  user2_id: number;
  status: 'pending' | 'matched' | 'rejected';
  created_at: Date;
}

export interface CreateMatchData {
  user1_id: number;
  user2_id: number;
  status?: 'pending' | 'matched' | 'rejected';
}

export class MatchModel {
  static async create(matchData: CreateMatchData): Promise<Match> {
    const { user1_id, user2_id, status = 'pending' } = matchData;
    
    const match = await prisma.match.create({
      data: {
        user1Id: user1_id,
        user2Id: user2_id,
        status: status
      }
    });
    
    return {
      id: match.id,
      user1_id: match.user1Id,
      user2_id: match.user2Id,
      status: match.status as 'pending' | 'matched' | 'rejected',
      created_at: match.createdAt
    };
  }

  static async findExistingMatch(user1Id: number, user2Id: number): Promise<Match | null> {
    const match = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: user1Id, user2Id: user2Id },
          { user1Id: user2Id, user2Id: user1Id }
        ]
      }
    });
    
    if (!match) return null;
    
    return {
      id: match.id,
      user1_id: match.user1Id,
      user2_id: match.user2Id,
      status: match.status as 'pending' | 'matched' | 'rejected',
      created_at: match.createdAt
    };
  }

  static async findUserMatches(userId: number): Promise<any[]> {
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        status: 'matched'
      },
      include: {
        user1: {
          include: {
            profile: true
          }
        },
        user2: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return matches.map(match => ({
      id: match.id,
      user1_id: match.user1Id,
      user2_id: match.user2Id,
      status: match.status,
      created_at: match.createdAt,
      user1_name: match.user1.profile?.name,
      user1_photo: match.user1.profile?.profilePhotoUrl,
      user2_name: match.user2.profile?.name,
      user2_photo: match.user2.profile?.profilePhotoUrl
    }));
  }

  static async findUserInteractions(userId: number): Promise<number[]> {
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      select: {
        user1Id: true,
        user2Id: true
      }
    });
    
    return matches.map(match => 
      match.user1Id === userId ? match.user2Id : match.user1Id
    );
  }

  static async updateStatus(matchId: number, status: 'pending' | 'matched' | 'rejected'): Promise<Match> {
    const match = await prisma.match.update({
      where: { id: matchId },
      data: { status }
    });
    
    return {
      id: match.id,
      user1_id: match.user1Id,
      user2_id: match.user2Id,
      status: match.status as 'pending' | 'matched' | 'rejected',
      created_at: match.createdAt
    };
  }

  static async delete(matchId: number): Promise<void> {
    await prisma.match.delete({
      where: { id: matchId }
    });
  }
}
