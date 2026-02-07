const express = require('express');
const router = express.Router();
const Call = require('../models/Call');
const moment = require('moment');

// Get revenue statistics for today
router.get('/today', async (req, res) => {
  try {
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    const stats = await Call.getRevenueStats(startOfDay, endOfDay);

    res.json({
      success: true,
      data: stats.length > 0 ? stats[0] : {
        totalCalls: 0,
        totalDuration: 0,
        totalRevenue: 0,
        avgDuration: 0,
        avgRevenue: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get revenue statistics for a specific date range
router.post('/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    const stats = await Call.getRevenueStats(
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: stats.length > 0 ? stats[0] : {
        totalCalls: 0,
        totalDuration: 0,
        totalRevenue: 0,
        avgDuration: 0,
        avgRevenue: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get hourly breakdown for a specific date
router.get('/hourly/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const hourlyStats = await Call.getCallsByHour(date);

    // Fill in missing hours with zero values
    const fullDayStats = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStat = hourlyStats.find(s => s._id === hour);
      fullDayStats.push({
        hour,
        count: hourStat ? hourStat.count : 0,
        totalRevenue: hourStat ? hourStat.totalRevenue : 0
      });
    }

    res.json({
      success: true,
      data: fullDayStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get monthly revenue summary
router.get('/monthly/:year/:month', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    const startOfMonth = moment([year, month - 1]).startOf('month').toDate();
    const endOfMonth = moment([year, month - 1]).endOf('month').toDate();

    const dailyStats = await Call.aggregate([
      {
        $match: {
          startTime: { $gte: startOfMonth, $lte: endOfMonth },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: '$startTime' },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$revenue' },
          totalDuration: { $sum: '$duration' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: dailyStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get top callers by revenue
router.get('/top-callers/:limit?', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;

    const topCallers = await Call.aggregate([
      {
        $match: {
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$callerNumber',
          totalCalls: { $sum: 1 },
          totalRevenue: { $sum: '$revenue' },
          totalDuration: { $sum: '$duration' },
          avgDuration: { $avg: '$duration' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: limit
      }
    ]);

    res.json({
      success: true,
      data: topCallers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get real-time revenue dashboard data
router.get('/dashboard/realtime', async (req, res) => {
  try {
    const now = moment();
    const startOfDay = moment().startOf('day').toDate();
    const startOfHour = moment().startOf('hour').toDate();

    // Today's stats
    const todayStats = await Call.getRevenueStats(startOfDay, now.toDate());

    // This hour's stats
    const hourStats = await Call.getRevenueStats(startOfHour, now.toDate());

    // Last 7 days trend
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = moment().subtract(i, 'days').startOf('day').toDate();
      const dayEnd = moment().subtract(i, 'days').endOf('day').toDate();
      const dayStats = await Call.getRevenueStats(dayStart, dayEnd);
      
      last7Days.push({
        date: moment().subtract(i, 'days').format('YYYY-MM-DD'),
        stats: dayStats.length > 0 ? dayStats[0] : {
          totalCalls: 0,
          totalRevenue: 0
        }
      });
    }

    res.json({
      success: true,
      data: {
        today: todayStats.length > 0 ? todayStats[0] : {},
        thisHour: hourStats.length > 0 ? hourStats[0] : {},
        last7Days
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
