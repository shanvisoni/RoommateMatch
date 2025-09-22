import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { connectionModel } from '../models/Connection';
import { handleValidationErrors } from '../middleware/validation';
import { body } from 'express-validator';

const router = express.Router();

// Get all connection requests sent by the current user
router.get('/sent', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const connections = await connectionModel.findByRequesterId(userId);
    res.json({ success: true, data: connections });
  } catch (error) {
    console.error('Error fetching sent connections:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sent connections' });
  }
});

// Get all connection requests received by the current user
router.get('/received', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const connections = await connectionModel.findByReceiverId(userId);
    res.json({ success: true, data: connections });
  } catch (error) {
    console.error('Error fetching received connections:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch received connections' });
  }
});

// Send a connection request
router.post('/request', 
  authenticateToken,
  [
    body('receiverId').isInt().withMessage('Receiver ID must be a valid integer'),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const { receiverId } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      if (userId === receiverId) {
        res.status(400).json({ success: false, error: 'Cannot send connection request to yourself' });
        return;
      }

      // Check if connection already exists
      const existingConnection = await connectionModel.findByUserAndTarget(userId, receiverId);
      if (existingConnection) {
        res.status(400).json({ success: false, error: 'Connection request already exists' });
        return;
      }

      const connection = await connectionModel.create({
        requesterId: userId,
        receiverId,
      });

      res.json({ success: true, data: connection });
    } catch (error) {
      console.error('Error sending connection request:', error);
      res.status(500).json({ success: false, error: 'Failed to send connection request' });
    }
  }
);

// Accept a connection request
router.put('/accept/:connectionId', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    const { connectionId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const connection = await connectionModel.update(parseInt(connectionId), { status: 'accepted' });
    res.json({ success: true, data: connection });
  } catch (error) {
    console.error('Error accepting connection:', error);
    res.status(500).json({ success: false, error: 'Failed to accept connection' });
  }
});

// Reject a connection request
router.put('/reject/:connectionId', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    const { connectionId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const connection = await connectionModel.update(parseInt(connectionId), { status: 'rejected' });
    res.json({ success: true, data: connection });
  } catch (error) {
    console.error('Error rejecting connection:', error);
    res.status(500).json({ success: false, error: 'Failed to reject connection' });
  }
});

// Get connection status between two users
router.get('/status/:targetUserId', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    const { targetUserId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const status = await connectionModel.getConnectionStatus(userId, parseInt(targetUserId));
    res.json({ success: true, data: { status } });
  } catch (error) {
    console.error('Error getting connection status:', error);
    res.status(500).json({ success: false, error: 'Failed to get connection status' });
  }
});

// Delete a connection
router.delete('/:connectionId', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    const { connectionId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    await connectionModel.delete(parseInt(connectionId));
    res.json({ success: true, message: 'Connection deleted successfully' });
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({ success: false, error: 'Failed to delete connection' });
  }
});

export default router;
