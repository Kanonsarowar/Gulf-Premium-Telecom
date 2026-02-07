require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gulf-telecom';

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log('Username:', existingAdmin.username);
      console.log('Email:', existingAdmin.email);
      return;
    }

    // Create admin user
    const admin = new User({
      username: 'admin',
      email: 'admin@gulf-telecom.com',
      password: 'admin123',
      fullName: 'System Administrator',
      role: 'admin',
      company: 'Gulf Premium Telecom'
    });

    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('-----------------------------------');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email: admin@gulf-telecom.com');
    console.log('-----------------------------------');
    console.log('⚠️  IMPORTANT: Change the password after first login!');

    // Create a sample reseller for demo
    const reseller = new User({
      username: 'reseller1',
      email: 'reseller1@example.com',
      password: 'reseller123',
      fullName: 'Demo Reseller',
      role: 'reseller',
      company: 'Demo Company',
      phone: '+1234567890',
      ratePerMinute: 0.15,
      creditLimit: 1000
    });

    await reseller.save();

    console.log('\n✅ Demo reseller created successfully!');
    console.log('-----------------------------------');
    console.log('Username: reseller1');
    console.log('Password: reseller123');
    console.log('Reseller Code:', reseller.resellerCode);
    console.log('-----------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
