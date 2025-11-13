// backend/controllers/userController.js
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const token = require('../createJWT');
const crypto = require('crypto');
const { sendVerificationEmail, sendUsernameEmail, sendPasswordResetEmail } = require('../../cards/emailService');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    // Validation
    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required (firstName, lastName, username, email, password)' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Check if user already exists
    const existingEmail = await User.findOne({ Email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    const existingUser = await User.findOne({ Username: username.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'This username already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get next UserID
    const lastUser = await User.findOne().sort({ UserID: -1 }).lean();
    const nextUserId = lastUser ? lastUser.UserID + 1 : 1;

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000 * 30); // 30 days

    // Create new user
    const newUser = new User({
      UserID: nextUserId,
      FirstName: firstName,
      LastName: lastName,
      Username: username.toLowerCase(),
      Email: email.toLowerCase(),
      Password: hashedPassword,
      IsVerified: false,
      VerificationToken: verificationToken,
      VerificationTokenExpires: verificationTokenExpires,
      CalorieGoal: 2000,
      ProteinGoal: 100,
      CarbsGoal: 100,
      FatGoal: 100,
      DayRolloverTime: "00:00",
      CreatedAt: new Date()
    });

    await newUser.save();

    // Send verification email
    try {
      console.log('🔵 Attempting to send verification email to:', email.toLowerCase());
      await sendVerificationEmail(email.toLowerCase(), verificationToken, firstName);
      console.log('✅ Verification email sent successfully!');
    } catch (emailError) {
      console.error('❌ Error sending verification email:', emailError);
      // Continue anyway - user exists and can request resend
    }

    return res.status(201).json({ 
      success: true, 
      message: 'User registered successfully. Please check your email to verify your account.',
      userId: nextUserId 
    });
  } catch (e) {
    console.error('Registration error:', e);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
};

// Login user
exports.login = async (req, res) => {
  let { username, password } = req.body;

  username = (username || '').trim().toLowerCase();
  password = (password || '').trim();

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and Password are required' });
  }

  try {
    const u = await User.findOne({ Username: username }).lean();

    if (!u) {
      return res.status(401).json({ error: 'Username/Password incorrect' });
    }

    const isValidPassword = await bcrypt.compare(password, u.Password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Username/Password incorrect' });
    }


    if (!u.IsVerified) {
    return res.status(401).json({ error: 'Your Email not yet verified. Please check your inbox.' });
    }

    const id = u.UserID;
    const fn = u.FirstName;
    const ln = u.LastName;

    try {
      const ret = token.createToken(fn, ln, id);
      return res.status(200).json({
      success: true,
      accessToken: ret.accessToken,
      userId: id,
      firstName: fn,
      lastName: ln,
      username: u.Username
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }

    



  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
};
// Get user profile with goals
exports.getUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findOne({ UserID: parseInt(userId) })
      .select('-Password -VerificationToken -VerificationTokenExpires -ResetPasswordToken -ResetPasswordExpires')
      .lean();

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        userId: user.UserID,
        firstName: user.FirstName,
        lastName: user.LastName,
        username: user.Username,
        email: user.Email,
        calorieGoal: user.CalorieGoal,
        proteinGoal: user.ProteinGoal,
        carbsGoal: user.CarbsGoal,
        fatGoal: user.FatGoal,
        dayRolloverTime: user.DayRolloverTime,
        isVerified: user.IsVerified,
        createdAt: user.CreatedAt
      }
    });
  } catch (e) {
    console.error('Get user error:', e);
    return res.status(500).json({ 
      success: false,
      error: 'Server error retrieving user' 
    });
  }
};

// Update calorie goal
exports.updateCalorieGoal = async (req, res) => {
  const { userId } = req.params;
  const { calorieGoal } = req.body;
  
  if (!calorieGoal && calorieGoal !== 0) {
    return res.status(400).json({ error: 'calorieGoal is required' });
  }
  
  const calorieGoalInt = parseInt(calorieGoal);
  if (isNaN(calorieGoalInt) || calorieGoalInt < 0) {
    return res.status(400).json({ error: 'calorieGoal must be a valid positive integer' });
  }
  
  try {
    const user = await User.findOneAndUpdate(
      { UserID: parseInt(userId) },
      { CalorieGoal: calorieGoalInt },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Calorie goal updated successfully',
      calorieGoal: calorieGoalInt
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error updating calorie goal' });
  }
};

// Update macro goals (protein, carbs, fat)
exports.updateMacroGoals = async (req, res) => {
  const { userId } = req.params;
  const { proteinGoal, carbsGoal, fatGoal } = req.body;
  
  const updateFields = {};
  
  if (proteinGoal !== undefined) {
    const protein = parseInt(proteinGoal);
    if (isNaN(protein) || protein < 0) {
      return res.status(400).json({ error: 'proteinGoal must be a valid positive integer' });
    }
    updateFields.ProteinGoal = protein;
  }
  
  if (carbsGoal !== undefined) {
    const carbs = parseInt(carbsGoal);
    if (isNaN(carbs) || carbs < 0) {
      return res.status(400).json({ error: 'carbsGoal must be a valid positive integer' });
    }
    updateFields.CarbsGoal = carbs;
  }
  
  if (fatGoal !== undefined) {
    const fat = parseInt(fatGoal);
    if (isNaN(fat) || fat < 0) {
      return res.status(400).json({ error: 'fatGoal must be a valid positive integer' });
    }
    updateFields.FatGoal = fat;
  }
  
  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ error: 'At least one macro goal is required' });
  }
  
  try {
    const user = await User.findOneAndUpdate(
      { UserID: parseInt(userId) },
      updateFields,
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Macro goals updated successfully',
      proteinGoal: user.ProteinGoal,
      carbsGoal: user.CarbsGoal,
      fatGoal: user.FatGoal
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error updating macro goals' });
  }
};

// Edit day rollover time
exports.editDayRolloverTime = async (req, res) => {
  const { userId } = req.params;
  const { dayRolloverTime } = req.body;
  
  if (!dayRolloverTime) {
    return res.status(400).json({ error: 'dayRolloverTime is required' });
  }
  
  // Validate time format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(dayRolloverTime)) {
    return res.status(400).json({ error: 'dayRolloverTime must be in HH:MM format (24-hour)' });
  }
  
  try {
    const user = await User.findOneAndUpdate(
      { UserID: parseInt(userId) },
      { DayRolloverTime: dayRolloverTime },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Day rollover time updated successfully',
      dayRolloverTime
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error updating day rollover time' });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const user = await User.findOne({
      VerificationToken: token,
      VerificationTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    user.IsVerified = true;
    user.VerificationToken = null;
    user.VerificationTokenExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
};

// Forgot username
exports.forgotUsername = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ Email: email.toLowerCase() });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email exists, we will send you a username recovery email.'
      });
    }

    try {
      await sendUsernameEmail(user.Email, user.Username, user.FirstName);
    } catch (emailError) {
      console.error('Error sending username email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send username email'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'If that email exists, we will send you a username recovery email.'
    });

  } catch (error) {
    console.error('Forgot username error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during username recovery'
    });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ Email: email.toLowerCase() });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email is in our system, we sent a password reset link.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 24 * 30 * 1000); // 30 days
    user.ResetPasswordToken = resetToken;
    user.ResetPasswordExpires = resetTokenExpires;
    await user.save();

    try {
      await sendPasswordResetEmail(user.Email, resetToken, user.FirstName);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'If that email exists, we will send you a password reset email.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    const user = await User.findOne({
      ResetPasswordToken: token,
      ResetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.Password = hashedPassword;
    user.ResetPasswordToken = null;
    user.ResetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
};
