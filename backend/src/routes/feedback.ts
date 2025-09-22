import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { feedbackModel } from '../models/Feedback';
import { handleValidationErrors } from '../middleware/validation';
import { body } from 'express-validator';

const router = express.Router();

// Get all feedback for a user
router.get('/user/:userId', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { userId } = req.params;
    const feedbacks = await feedbackModel.findByToUserId(parseInt(userId));
    const averageRating = await feedbackModel.getAverageRating(parseInt(userId));
    const ratingCount = await feedbackModel.getRatingCount(parseInt(userId));

    res.json({ 
      success: true, 
      data: { 
        feedbacks, 
        averageRating, 
        ratingCount 
      } 
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch feedback' });
  }
});

// Get feedback given by the current user
router.get('/given', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const feedbacks = await feedbackModel.findByFromUserId(userId);
    res.json({ success: true, data: feedbacks });
  } catch (error) {
    console.error('Error fetching given feedback:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch given feedback' });
  }
});

// Create feedback
router.post('/create', 
  authenticateToken,
  [
    body('toUserId').isInt().withMessage('User ID must be a valid integer'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().isLength({ max: 500 }).withMessage('Comment must be less than 500 characters'),
    body('cleanliness').optional().isInt({ min: 1, max: 5 }).withMessage('Cleanliness rating must be between 1 and 5'),
    body('communication').optional().isInt({ min: 1, max: 5 }).withMessage('Communication rating must be between 1 and 5'),
    body('reliability').optional().isInt({ min: 1, max: 5 }).withMessage('Reliability rating must be between 1 and 5'),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const { toUserId, rating, comment, cleanliness, communication, reliability } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      if (userId === toUserId) {
        res.status(400).json({ success: false, error: 'Cannot give feedback to yourself' });
        return;
      }

      // Check if feedback already exists
      const existingFeedback = await feedbackModel.findByFromAndToUser(userId, toUserId);
      if (existingFeedback) {
        res.status(400).json({ success: false, error: 'Feedback already exists for this user' });
        return;
      }

      const feedback = await feedbackModel.create({
        fromUserId: userId,
        toUserId,
        rating,
        comment,
        cleanliness,
        communication,
        reliability,
      });

      res.json({ success: true, data: feedback });
    } catch (error) {
      console.error('Error creating feedback:', error);
      res.status(500).json({ success: false, error: 'Failed to create feedback' });
    }
  }
);

// Update feedback
router.put('/update/:feedbackId', 
  authenticateToken,
  [
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().isLength({ max: 500 }).withMessage('Comment must be less than 500 characters'),
    body('cleanliness').optional().isInt({ min: 1, max: 5 }).withMessage('Cleanliness rating must be between 1 and 5'),
    body('communication').optional().isInt({ min: 1, max: 5 }).withMessage('Communication rating must be between 1 and 5'),
    body('reliability').optional().isInt({ min: 1, max: 5 }).withMessage('Reliability rating must be between 1 and 5'),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const { feedbackId } = req.params;
      const { rating, comment, cleanliness, communication, reliability } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      const feedback = await feedbackModel.update(parseInt(feedbackId), {
        rating,
        comment,
        cleanliness,
        communication,
        reliability,
      });

      res.json({ success: true, data: feedback });
    } catch (error) {
      console.error('Error updating feedback:', error);
      res.status(500).json({ success: false, error: 'Failed to update feedback' });
    }
  }
);

// Delete feedback
router.delete('/:feedbackId', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    const { feedbackId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    await feedbackModel.delete(parseInt(feedbackId));
    res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ success: false, error: 'Failed to delete feedback' });
  }
});

// Check if feedback exists between two users
router.get('/check/:toUserId', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    const { toUserId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const feedback = await feedbackModel.findByFromAndToUser(userId, parseInt(toUserId));
    res.json({ success: true, data: { exists: !!feedback, feedback } });
  } catch (error) {
    console.error('Error checking feedback:', error);
    res.status(500).json({ success: false, error: 'Failed to check feedback' });
  }
});

export default router;
