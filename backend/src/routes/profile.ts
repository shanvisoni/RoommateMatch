import express from 'express';
import { body } from 'express-validator';
import { ProfileModel } from '../models/Profile';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Create profile
router.post('/', [
  authenticateToken,
  body('name').notEmpty().withMessage('Name is required'),
  body('age').isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
  body('bio').isLength({ min: 5, max: 500 }).withMessage('Bio must be between 5 and 500 characters'),
  body('location').notEmpty().withMessage('Location is required'),
  handleValidationErrors
], async (req: AuthenticatedRequest, res: any) => {
  try {
    console.log('📝 Creating profile with data:', req.body);
    const { 
      name, 
      age, 
      bio, 
      location, 
      profile_photo_url,
      gender,
      profession,
      budget,
      moveInDate,
      smoking,
      drinking,
      pets,
      socialLevel,
      cooking
    } = req.body;

    // Check if profile already exists
    const existingProfile = await ProfileModel.findByUserId(req.user!.id);
    if (existingProfile) {
      res.status(400).json({
        success: false,
        error: 'Profile already exists'
      });
      return;
    }

    const profile = await ProfileModel.create({
      userId: req.user!.id,
      name,
      age,
      bio,
      location,
      profilePhotoUrl: profile_photo_url,
      gender,
      profession,
      budget,
      moveInDate: moveInDate ? new Date(moveInDate) : undefined,
      smoking,
      drinking,
      pets,
      socialLevel,
      cooking
    });

    console.log('✅ Profile created successfully:', profile);
    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: profile
    });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get profile
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    console.log('🔍 Getting profile for user:', req.user!.id);
    const profile = await ProfileModel.findByUserId(req.user!.id);
    console.log('📋 Profile found:', profile);
    
    if (!profile) {
      console.log('❌ No profile found for user:', req.user!.id);
      res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
      return;
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update profile
router.put('/', [
  authenticateToken,
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('age').optional().isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
  body('bio').optional().isLength({ min: 10, max: 500 }).withMessage('Bio must be between 10 and 500 characters'),
  body('location').optional().notEmpty().withMessage('Location cannot be empty'),
  handleValidationErrors
], async (req: AuthenticatedRequest, res: any) => {
  try {
    const { 
      name, 
      age, 
      bio, 
      location, 
      profile_photo_url,
      gender,
      profession,
      budget,
      moveInDate,
      smoking,
      drinking,
      pets,
      socialLevel,
      cooking
    } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (age) updateData.age = age;
    if (bio) updateData.bio = bio;
    if (location) updateData.location = location;
    if (profile_photo_url) updateData.profilePhotoUrl = profile_photo_url;
    if (gender !== undefined) updateData.gender = gender;
    if (profession !== undefined) updateData.profession = profession;
    if (budget !== undefined) updateData.budget = budget;
    if (moveInDate !== undefined) updateData.moveInDate = moveInDate ? new Date(moveInDate) : undefined;
    if (smoking !== undefined) updateData.smoking = smoking;
    if (drinking !== undefined) updateData.drinking = drinking;
    if (pets !== undefined) updateData.pets = pets;
    if (socialLevel !== undefined) updateData.socialLevel = socialLevel;
    if (cooking !== undefined) updateData.cooking = cooking;

    const profile = await ProfileModel.update(req.user!.id, updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all profiles
router.get('/all', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const profiles = await ProfileModel.findAllExceptUserId(req.user!.id);

    res.json({
      success: true,
      data: profiles
    });
  } catch (error) {
    console.error('Get all profiles error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get profile by user ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
      return;
    }

    const profile = await ProfileModel.findByUserId(userId);
    
    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
      return;
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get profile by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
