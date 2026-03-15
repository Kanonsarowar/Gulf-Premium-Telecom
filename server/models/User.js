const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'reseller', 'user'],
    default: 'reseller'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  company: String,
  phone: String,
  address: String,
  // Reseller specific fields
  resellerCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  ratePerMinute: {
    type: Number,
    default: 0.10
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  // Statistics
  stats: {
    totalCalls: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    lastCallDate: Date
  },
  // Settings
  settings: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    theme: { type: String, enum: ['light', 'dark'], default: 'dark' }
  },
  lastLogin: Date,
  lastLoginIp: String
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate reseller code before saving if role is reseller
UserSchema.pre('save', function(next) {
  if (this.role === 'reseller' && !this.resellerCode) {
    this.resellerCode = 'R' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Static method to get reseller stats
UserSchema.statics.getResellerStats = async function(resellerId) {
  const Call = mongoose.model('Call');
  
  const stats = await Call.aggregate([
    {
      $match: {
        resellerId: mongoose.Types.ObjectId(resellerId),
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        totalRevenue: { $sum: '$revenue' },
        avgDuration: { $avg: '$duration' },
        avgRevenue: { $avg: '$revenue' }
      }
    }
  ]);
  
  return stats[0] || {
    totalCalls: 0,
    totalDuration: 0,
    totalRevenue: 0,
    avgDuration: 0,
    avgRevenue: 0
  };
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
