// backend/controllers/userController.js
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const token = require('../createJWT');

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

    // Create new user
    const newUser = new User({
      UserID: nextUserId,
      FirstName: firstName,
      LastName: lastName,
      Username: username.toLowerCase(),
      Email: email.toLowerCase(),
      Password: hashedPassword,
      IsVerified: false,
      CalorieGoal: 2000,
      ProteinGoal: 100,
      CarbsGoal: 100,
      FatGoal: 100,
      DayRolloverTime: "00:00",
      CreatedAt: new Date()
    });

    await newUser.save();

    return res.status(201).json({ 
      success: true, 
      message: 'User registered successfully',
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