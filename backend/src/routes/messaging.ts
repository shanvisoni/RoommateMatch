import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/database';
import { io } from '../index';

const router = express.Router();

// Send a message
router.post('/send', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user!.id;

    if (!receiverId || !content) {
      res.status(400).json({
        success: false,
        error: 'Receiver ID and content are required'
      });
      return;
    }

    // Check if users exist
    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });

    if (!sender || !receiver) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Check if there's an accepted connection between users
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: senderId, receiverId: receiverId, status: 'accepted' },
          { requesterId: receiverId, receiverId: senderId, status: 'accepted' }
        ]
      }
    });

    if (!connection) {
      res.status(403).json({
        success: false,
        error: 'Connection not accepted'
      });
      return;
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                profilePhotoUrl: true
              }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                profilePhotoUrl: true
              }
            }
          }
        }
      }
    });

    console.log('✅ Message created:', message.id);

    // Emit WebSocket event to both users
    const roomId1 = `chat_${receiverId}`;
    const roomId2 = `chat_${senderId}`;
    
    const messageData = {
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      createdAt: message.createdAt
    };

    // Send to receiver's room
    io.to(roomId1).emit('receive_message', messageData);
    // Send to sender's room (for real-time updates)
    io.to(roomId2).emit('receive_message', messageData);

    console.log('📡 WebSocket events emitted to rooms:', roomId1, roomId2);

    res.json({
      success: true,
      data: {
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        createdAt: message.createdAt
      }
    });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get messages with a user
router.get('/messages/:userId', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!.id;

    // Check if users exist
    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
    const otherUser = await prisma.user.findUnique({ where: { id: parseInt(userId) } });

    if (!currentUser || !otherUser) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Check if there's an accepted connection between users
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, receiverId: parseInt(userId), status: 'accepted' },
          { requesterId: parseInt(userId), receiverId: currentUserId, status: 'accepted' }
        ]
      }
    });

    if (!connection) {
      res.status(403).json({
        success: false,
        error: 'Connection not accepted'
      });
      return;
    }

    // Get messages between the two users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: parseInt(userId) },
          { senderId: parseInt(userId), receiverId: currentUserId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                profilePhotoUrl: true
              }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                profilePhotoUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log('✅ Messages retrieved:', messages.length);

    res.json({
      success: true,
      data: messages.map(message => ({
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        createdAt: message.createdAt
      }))
    });
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get chat rooms
router.get('/chat-rooms', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const currentUserId = req.user!.id;

    // Get all accepted connections for the current user
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: currentUserId, status: 'accepted' },
          { receiverId: currentUserId, status: 'accepted' }
        ]
      },
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                profilePhotoUrl: true,
                location: true
              }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                profilePhotoUrl: true,
                location: true
              }
            }
          }
        }
      }
    });

    // Create chat rooms from connections
    const chatRooms = connections.map(connection => {
      const otherUser = connection.requesterId === currentUserId 
        ? connection.receiver 
        : connection.requester;
      
      return {
        id: connection.id,
        user1Id: currentUserId,
        user2Id: otherUser.id,
        otherUser: {
          id: otherUser.id,
          name: otherUser.profile?.name || 'Unknown',
          profilePhotoUrl: otherUser.profile?.profilePhotoUrl,
          location: otherUser.profile?.location
        }
      };
    });

    console.log('✅ Chat rooms retrieved:', chatRooms.length);

    res.json({
      success: true,
      data: chatRooms
    });
  } catch (error: any) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;