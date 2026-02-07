const express = require('express');
const router = express.Router();
const Call = require('../models/Call');
const asteriskService = require('../services/asteriskService');

// Get all calls with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const calls = await Call.find()
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Call.countDocuments();

    res.json({
      success: true,
      data: calls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get active calls
router.get('/active', async (req, res) => {
  try {
    const activeCalls = asteriskService.getActiveCalls();
    res.json({
      success: true,
      data: activeCalls,
      count: activeCalls.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get call by ID
router.get('/:callId', async (req, res) => {
  try {
    const call = await Call.findOne({ callId: req.params.callId });
    
    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    res.json({
      success: true,
      data: call
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get calls by caller number
router.get('/caller/:number', async (req, res) => {
  try {
    const calls = await Call.find({ callerNumber: req.params.number })
      .sort({ startTime: -1 })
      .limit(100);

    res.json({
      success: true,
      data: calls,
      count: calls.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get calls by date range
router.post('/date-range', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    const calls = await Call.find({
      startTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ startTime: -1 });

    res.json({
      success: true,
      data: calls,
      count: calls.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Hangup a channel
router.post('/hangup/:channel', async (req, res) => {
  try {
    await asteriskService.hangupChannel(req.params.channel);
    res.json({
      success: true,
      message: 'Hangup command sent'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
