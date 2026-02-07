const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Call = require('../models/Call');
const { authMiddleware, adminMiddleware } = require('./authRoutes');

// Get all users (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    // Admin can view any user, resellers can only view themselves
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user statistics
    const stats = await User.getResellerStats(user._id);

    res.json({ user, stats });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new user (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { username, email, password, fullName, role, company, phone, ratePerMinute, creditLimit } = req.body;

    // Validation
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Create user
    const user = new User({
      username,
      email,
      password,
      fullName,
      role: role || 'reseller',
      company,
      phone,
      ratePerMinute: ratePerMinute || 0.10,
      creditLimit: creditLimit || 0
    });

    await user.save();

    res.status(201).json({ 
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        resellerCode: user.resellerCode
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (admin or self)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // Admin can update any user, resellers can only update themselves (limited fields)
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fields that can be updated
    const allowedFields = req.user.role === 'admin'
      ? ['fullName', 'email', 'company', 'phone', 'ratePerMinute', 'creditLimit', 'isActive', 'role']
      : ['fullName', 'email', 'company', 'phone', 'settings'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'settings') {
          user.settings = { ...user.settings, ...req.body.settings };
        } else {
          user[field] = req.body[field];
        }
      }
    });

    // Update password if provided
    if (req.body.password && (req.user.role === 'admin' || req.user._id.toString() === req.params.id)) {
      user.password = req.body.password;
    }

    await user.save();

    res.json({ 
      message: 'User updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await user.deleteOne();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard stats for admin
router.get('/stats/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Total users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Active resellers (had calls in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeResellers = await Call.distinct('resellerId', {
      startTime: { $gte: thirtyDaysAgo },
      resellerId: { $exists: true }
    });

    // Top resellers by revenue
    const topResellers = await Call.aggregate([
      { 
        $match: { 
          status: 'completed',
          resellerId: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$resellerId',
          totalCalls: { $sum: 1 },
          totalRevenue: { $sum: '$revenue' },
          totalDuration: { $sum: '$duration' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          resellerId: '$_id',
          username: '$user.username',
          fullName: '$user.fullName',
          resellerCode: '$user.resellerCode',
          totalCalls: 1,
          totalRevenue: 1,
          totalDuration: 1
        }
      }
    ]);

    res.json({
      usersByRole,
      totalUsers: await User.countDocuments(),
      activeResellers: activeResellers.length,
      topResellers
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
