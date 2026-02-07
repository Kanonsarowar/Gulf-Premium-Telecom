const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
  callId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  channelId: {
    type: String,
    required: true
  },
  callerNumber: {
    type: String,
    required: true,
    index: true
  },
  callerName: String,
  // Reseller assignment
  resellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  resellerCode: {
    type: String,
    index: true
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    default: 'inbound'
  },
  status: {
    type: String,
    enum: ['ringing', 'answered', 'connected', 'completed', 'failed'],
    default: 'ringing'
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  answerTime: Date,
  bridgeTime: Date,
  endTime: Date,
  duration: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  hangupCause: String,
  hangupCauseText: String,
  ivrData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  events: [{
    type: {
      type: String
    },
    state: String,
    destination: String,
    channel1: String,
    channel2: String,
    timestamp: Date
  }]
}, {
  timestamps: true
});

// Add indexes for common queries
CallSchema.index({ startTime: -1 });
CallSchema.index({ status: 1, startTime: -1 });
CallSchema.index({ callerNumber: 1, startTime: -1 });

// Add methods
CallSchema.methods.calculateRevenue = function() {
  if (this.duration > 0) {
    const ratePerMinute = parseFloat(process.env.CALL_RATE_PER_MINUTE || 0.10);
    this.revenue = (this.duration / 60) * ratePerMinute;
  }
  return this.revenue;
};

// Static methods for analytics
CallSchema.statics.getRevenueStats = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate },
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
};

CallSchema.statics.getCallsByHour = async function(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.aggregate([
    {
      $match: {
        startTime: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: { $hour: '$startTime' },
        count: { $sum: 1 },
        totalRevenue: { $sum: '$revenue' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

const Call = mongoose.model('Call', CallSchema);

module.exports = Call;
