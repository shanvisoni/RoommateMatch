import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { savedProfileModel } from '../models/SavedProfile';
import { handleValidationErrors } from '../middleware/validation';
import { body } from 'express-validator';

const router = express.Router();

// Get all saved profiles for the current user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const savedProfiles = await savedProfileModel.findByUserId(userId);
    res.json({ success: true, data: savedProfiles });
  } catch (error) {
    console.error('Error fetching saved profiles:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch saved profiles' });
  }
});

// Save a profile
router.post('/save', 
  authenticateToken,
  [
    body('profileId').isInt().withMessage('Profile ID must be a valid integer'),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.id;
      const { profileId } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      // Check if already saved
      const existingSaved = await savedProfileModel.findByUserAndProfile(userId, profileId);
      if (existingSaved) {
        res.status(400).json({ success: false, error: 'Profile already saved' });
        return;
      }

      const savedProfile = await savedProfileModel.create({
        userId,
        profileId,
      });

      res.json({ success: true, data: savedProfile });
    } catch (error) {
      console.error('Error saving profile:', error);
      res.status(500).json({ success: false, error: 'Failed to save profile' });
    }
  }
);

// Unsave a profile
router.delete('/unsave/:profileId', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    const { profileId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    await savedProfileModel.delete(userId, parseInt(profileId));
    res.json({ success: true, message: 'Profile unsaved successfully' });
  } catch (error) {
    console.error('Error unsaving profile:', error);
    res.status(500).json({ success: false, error: 'Failed to unsave profile' });
  }
});

// Check if a profile is saved
router.get('/check/:profileId', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    const { profileId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const isSaved = await savedProfileModel.isSaved(userId, parseInt(profileId));
    res.json({ success: true, data: { isSaved } });
  } catch (error) {
    console.error('Error checking saved status:', error);
    res.status(500).json({ success: false, error: 'Failed to check saved status' });
  }
});

export default router;
