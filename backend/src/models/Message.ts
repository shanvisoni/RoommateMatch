import prisma from '../config/database';

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: Date;
}

export interface CreateMessageData {
  sender_id: number;
  receiver_id: number;
  content: string;
}

export class MessageModel {
  static async create(messageData: CreateMessageData): Promise<Message> {
    const { sender_id, receiver_id, content } = messageData;
    
    const message = await prisma.message.create({
      data: {
        senderId: sender_id,
        receiverId: receiver_id,
        content: content
      }
    });
    
    return {
      id: message.id,
      sender_id: message.senderId,
      receiver_id: message.receiverId,
      content: message.content,
      created_at: message.createdAt
    };
  }

  static async findConversation(user1Id: number, user2Id: number): Promise<any[]> {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user1Id, receiverId: user2Id },
          { senderId: user2Id, receiverId: user1Id }
        ]
      },
      include: {
        sender: {
          include: {
            profile: true
          }
        },
        receiver: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    return messages.map(message => ({
      id: message.id,
      sender_id: message.senderId,
      receiver_id: message.receiverId,
      content: message.content,
      created_at: message.createdAt,
      sender_name: message.sender.profile?.name,
      sender_photo: message.sender.profile?.profilePhotoUrl,
      receiver_name: message.receiver.profile?.name,
      receiver_photo: message.receiver.profile?.profilePhotoUrl
    }));
  }

  static async findUserChatRooms(userId: number): Promise<any[]> {
    // Get all unique chat partners for the user
    const chatPartners = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      select: {
        senderId: true,
        receiverId: true,
        createdAt: true,
        content: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group by chat partner and get the latest message for each
    const chatRooms = new Map<number, any>();
    
    for (const message of chatPartners) {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      
      if (!chatRooms.has(otherUserId)) {
        chatRooms.set(otherUserId, {
          other_user_id: otherUserId,
          last_message_time: message.createdAt,
          last_message_content: message.content,
          last_message_sender_id: message.senderId
        });
      }
    }

    // Get profile information for each chat partner
    const chatRoomArray = Array.from(chatRooms.values());
    const userIds = chatRoomArray.map(room => room.other_user_id);
    
    const profiles = await prisma.profile.findMany({
      where: {
        userId: { in: userIds }
      },
      select: {
        userId: true,
        name: true,
        profilePhotoUrl: true,
        location: true
      }
    });

    // Combine chat room data with profile information
    return chatRoomArray.map(room => {
      const profile = profiles.find(p => p.userId === room.other_user_id);
      return {
        other_user_id: room.other_user_id,
        other_user_name: profile?.name,
        other_user_photo: profile?.profilePhotoUrl,
        other_user_location: profile?.location,
        last_message_time: room.last_message_time,
        last_message_content: room.last_message_content,
        last_message_sender_id: room.last_message_sender_id
      };
    }).sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());
  }

  static async findById(id: number): Promise<Message | null> {
    const message = await prisma.message.findUnique({
      where: { id }
    });
    
    if (!message) return null;
    
    return {
      id: message.id,
      sender_id: message.senderId,
      receiver_id: message.receiverId,
      content: message.content,
      created_at: message.createdAt
    };
  }

  static async delete(id: number): Promise<void> {
    await prisma.message.delete({
      where: { id }
    });
  }
}
