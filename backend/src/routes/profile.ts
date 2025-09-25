import express from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { ProfileModel } from '../models/Profile';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload profile photo
router.post('/upload-photo', authenticateToken, upload.single('photo'), async (req: AuthenticatedRequest, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const userId = req.user!.id;
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `profile_${userId}_${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Process image with sharp (resize and optimize)
    const processedBuffer = await sharp(req.file.buffer)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Save the processed image
    await fs.promises.writeFile(filePath, processedBuffer);

    // Convert to base64 for storage (works perfectly for deployment)
    const base64Image = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
    
    // Return both URL and base64 for flexibility
    const photoUrl = `/uploads/${fileName}`;

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      data: { 
        photoUrl,
        base64Image // Include base64 as fallback
      }
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload photo'
    });
  }
});

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
    console.log('📸 Profile photo URL received:', req.body.profilePhotoUrl);
    const { 
      name, 
      age, 
      bio, 
      location, 
      profilePhotoUrl,
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
      profilePhotoUrl: profilePhotoUrl,
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
      profilePhotoUrl,
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
    if (profilePhotoUrl) updateData.profilePhotoUrl = profilePhotoUrl;
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
    console.log('🔍 All profiles found:', profiles.length);
    console.log('📸 First profile photo URLs:', profiles.slice(0, 3).map(p => ({ name: p.name, profilePhotoUrl: p.profilePhotoUrl })));

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
