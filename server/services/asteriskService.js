const AsteriskManager = require('asterisk-manager');
const CallModel = require('../models/Call');
const { v4: uuidv4 } = require('uuid');

class AsteriskService {
  constructor() {
    this.ami = null;
    this.connected = false;
    this.activeCalls = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ami = new AsteriskManager(
        process.env.ASTERISK_PORT || 5038,
        process.env.ASTERISK_HOST || 'localhost',
        process.env.ASTERISK_USERNAME || 'admin',
        process.env.ASTERISK_PASSWORD || 'amp111',
        true // Keep connection alive
      );

      this.ami.keepConnected();

      // Handle successful connection
      this.ami.on('connect', () => {
        console.log('Connected to Asterisk Manager Interface');
        this.connected = true;
        this.setupEventListeners();
        resolve();
      });

      // Handle connection errors
      this.ami.on('error', (err) => {
        console.error('AMI Error:', err);
        this.connected = false;
        reject(err);
      });

      // Handle disconnection
      this.ami.on('close', () => {
        console.log('AMI connection closed');
        this.connected = false;
      });

      // Handle reconnection
      this.ami.on('reconnection', () => {
        console.log('AMI reconnected');
        this.connected = true;
      });
    });
  }

  setupEventListeners() {
    // Listen for incoming calls
    this.ami.on('managerevent', (event) => {
      this.handleAsteriskEvent(event);
    });
  }

  async handleAsteriskEvent(event) {
    const eventName = event.event;

    switch (eventName) {
      case 'Newchannel':
        await this.handleNewChannel(event);
        break;
      case 'Newstate':
        await this.handleNewState(event);
        break;
      case 'Dial':
        await this.handleDial(event);
        break;
      case 'Hangup':
        await this.handleHangup(event);
        break;
      case 'Bridge':
        await this.handleBridge(event);
        break;
      case 'VarSet':
        await this.handleVarSet(event);
        break;
      default:
        // Uncomment to see all events for debugging
        // console.log('Unhandled event:', eventName);
        break;
    }
  }

  async handleNewChannel(event) {
    const callId = uuidv4();
    const channelId = event.channel;
    const callerNumber = event.calleridnum;
    const callerName = event.calleridname;

    const callData = {
      callId,
      channelId,
      callerNumber,
      callerName,
      status: 'ringing',
      direction: 'inbound',
      startTime: new Date(),
      events: []
    };

    this.activeCalls.set(channelId, callData);

    // Broadcast to WebSocket clients
    if (global.broadcast) {
      global.broadcast({
        type: 'call_new',
        data: callData
      });
    }

    console.log(`New call from ${callerNumber} (${callerName}) on channel ${channelId}`);
  }

  async handleNewState(event) {
    const channelId = event.channel;
    const callData = this.activeCalls.get(channelId);

    if (callData) {
      const channelState = event.channelstate;
      const channelStateDesc = event.channelstatedesc;

      callData.events.push({
        type: 'state_change',
        state: channelStateDesc,
        timestamp: new Date()
      });

      // Update status based on channel state
      if (channelStateDesc === 'Up') {
        callData.status = 'answered';
        callData.answerTime = new Date();
      } else if (channelStateDesc === 'Ringing') {
        callData.status = 'ringing';
      }

      this.activeCalls.set(channelId, callData);

      // Broadcast update
      if (global.broadcast) {
        global.broadcast({
          type: 'call_update',
          data: callData
        });
      }
    }
  }

  async handleDial(event) {
    const channelId = event.channel;
    const callData = this.activeCalls.get(channelId);

    if (callData) {
      callData.events.push({
        type: 'dial',
        destination: event.destination,
        timestamp: new Date()
      });

      this.activeCalls.set(channelId, callData);
    }
  }

  async handleBridge(event) {
    const channel1 = event.channel1;
    const channel2 = event.channel2;

    const callData = this.activeCalls.get(channel1) || this.activeCalls.get(channel2);

    if (callData) {
      callData.status = 'connected';
      callData.bridgeTime = new Date();
      callData.events.push({
        type: 'bridge',
        channel1,
        channel2,
        timestamp: new Date()
      });

      // Broadcast update
      if (global.broadcast) {
        global.broadcast({
          type: 'call_update',
          data: callData
        });
      }
    }
  }

  async handleHangup(event) {
    const channelId = event.channel;
    const callData = this.activeCalls.get(channelId);

    if (callData) {
      callData.status = 'completed';
      callData.endTime = new Date();
      callData.hangupCause = event.cause;
      callData.hangupCauseText = event.causetxt;

      // Calculate call duration
      if (callData.answerTime) {
        const duration = Math.floor((callData.endTime - callData.answerTime) / 1000);
        callData.duration = duration;

        // Calculate revenue
        const ratePerMinute = parseFloat(process.env.CALL_RATE_PER_MINUTE || 0.10);
        callData.revenue = (duration / 60) * ratePerMinute;
      } else {
        callData.duration = 0;
        callData.revenue = 0;
      }

      // Save to database
      try {
        await CallModel.create(callData);
        console.log(`Call ${callData.callId} saved to database`);
      } catch (err) {
        console.error('Error saving call to database:', err);
      }

      // Broadcast final update
      if (global.broadcast) {
        global.broadcast({
          type: 'call_ended',
          data: callData
        });
      }

      // Remove from active calls
      this.activeCalls.delete(channelId);
    }
  }

  async handleVarSet(event) {
    // Handle IVR variable settings
    const channelId = event.channel;
    const varName = event.variable;
    const varValue = event.value;

    const callData = this.activeCalls.get(channelId);

    if (callData && varName && varName.startsWith('IVR_')) {
      if (!callData.ivrData) {
        callData.ivrData = {};
      }
      callData.ivrData[varName] = varValue;

      // Broadcast IVR update
      if (global.broadcast) {
        global.broadcast({
          type: 'ivr_update',
          data: {
            callId: callData.callId,
            channelId,
            ivrData: callData.ivrData
          }
        });
      }
    }
  }

  isConnected() {
    return this.connected;
  }

  getActiveCalls() {
    return Array.from(this.activeCalls.values());
  }

  async executeCommand(action, params) {
    return new Promise((resolve, reject) => {
      if (!this.ami || !this.connected) {
        reject(new Error('AMI not connected'));
        return;
      }

      this.ami.action(action, params, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  async hangupChannel(channel) {
    return this.executeCommand('Hangup', { Channel: channel });
  }

  async getChannels() {
    return this.executeCommand('CoreShowChannels', {});
  }
}

module.exports = new AsteriskService();
