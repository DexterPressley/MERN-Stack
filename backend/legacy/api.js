// api.js
require('express');
require('mongodb');

const bcrypt = require('bcryptjs');
const token = require('./createJWT.js');
const User = require('./models/user.js');
const Food = require('./models/food.js');
const Day = require('./models/day.js');

exports.setApp = function (app, _mongoose) {

  // ==================== USER ENDPOINTS ====================

  // ------------------ /api/register ------------------
  // incoming: { firstName, lastName, username, email, password }
  // outgoing: { success: boolean, message: string, userId?: number }
  app.post('/api/register', async (req, res) => {
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
  });

  // ------------------ /api/login ------------------
  // incoming: { username, password }
  // outgoing: { accessToken, userId, firstName, lastName } | { error }
  app.post('/api/login', async (req, res) => {
    let { username, password } = req.body;

    username = (username || '').trim().toLowerCase();
    password = (password || '').trim();

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and Password are required' });
    }

    try {
      const u = await User.findOne({ Username: username }).lean();

      if (!u) {
        return res.status(200).json({ error: 'Username/Password incorrect' });
      }

      const isValidPassword = await bcrypt.compare(password, u.Password);
      if (!isValidPassword) {
        return res.status(200).json({ error: 'Username/Password incorrect' });
      }

      const id = u.UserID;
      const fn = u.FirstName;
      const ln = u.LastName;

      try {
        const ret = token.createToken(fn, ln, id);
        return res.status(200).json(ret);
      } catch (e) {
        return res.status(200).json({ error: e.message });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'server error' });
    }
  });

  // ------------------ /api/updatecaloriegoal ------------------
  // incoming: { userId, calorieGoal, jwtToken }
  // outgoing: { error, jwtToken }
  app.post('/api/updatecaloriegoal', async (req, res) => {
    const { userId, calorieGoal, jwtToken } = req.body;
    
    try {
      if (token.isExpired(jwtToken)) {
        return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
      }
    } catch (e) {
      console.log(e.message);
    }
    
    if (userId === undefined || userId === null) {
      return res.status(400).json({ error: 'userId is required', jwtToken: '' });
    }
    
    if (calorieGoal === undefined || calorieGoal === null) {
      return res.status(400).json({ error: 'calorieGoal is required', jwtToken: '' });
    }
    
    const calorieGoalInt = parseInt(calorieGoal);
    if (isNaN(calorieGoalInt) || calorieGoalInt < 0) {
      return res.status(400).json({ error: 'calorieGoal must be a valid positive integer', jwtToken: '' });
    }
    
    let error = '';
    try {
      await User.findOneAndUpdate({ UserID: userId }, { CalorieGoal: calorieGoalInt });
    } catch (e) {
      console.error(e);
      error = e.toString();
    }
    
    let refreshedToken = '';
    try {
      const rt = token.refresh(jwtToken);
      refreshedToken = rt && rt.accessToken ? rt.accessToken : '';
    } catch (e) {
      console.log(e.message);
    }
    
    return res.status(200).json({ error, jwtToken: refreshedToken });
  });

  // ------------------ /api/editdayrollovertime ------------------
  // incoming: { userId, dayRolloverTime, jwtToken }
  // outgoing: { error, jwtToken }
  app.post('/api/editdayrollovertime', async (req, res) => {
    const { userId, dayRolloverTime, jwtToken } = req.body;
    
    try {
      if (token.isExpired(jwtToken)) {
        return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
      }
    } catch (e) {
      console.log(e.message);
    }
    
    if (userId === undefined || userId === null) {
      return res.status(400).json({ error: 'userId is required', jwtToken: '' });
    }
    
    if (!dayRolloverTime) {
      return res.status(400).json({ error: 'dayRolloverTime is required', jwtToken: '' });
    }
    
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(dayRolloverTime)) {
      return res.status(400).json({ error: 'dayRolloverTime must be in HH:MM format (24-hour)', jwtToken: '' });
    }
    
    let error = '';
    try {
      await User.findOneAndUpdate({ UserID: userId }, { DayRolloverTime: dayRolloverTime });
    } catch (e) {
      console.error(e);
      error = e.toString();
    }
    
    let refreshedToken = '';
    try {
      const rt = token.refresh(jwtToken);
      refreshedToken = rt && rt.accessToken ? rt.accessToken : '';
    } catch (e) {
      console.log(e.message);
    }
    
    return res.status(200).json({ error, jwtToken: refreshedToken });
  });

  // ==================== FOOD ENDPOINTS ====================

  // ------------------ /api/addfood ------------------
  // incoming: { userId, name, caloriesPerUnit, unit, upc?, jwtToken }
  // outgoing: { error, foodId?, jwtToken }
  app.post('/api/addfood', async (req, res) => {
    const { userId, name, caloriesPerUnit, unit, upc, jwtToken } = req.body;

    try {
      if (token.isExpired(jwtToken)) {
        return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
      }
    } catch (e) {
      console.log(e.message);
    }

    if (userId === undefined || userId === null) {
      return res.status(400).json({ error: 'userId is required', jwtToken: '' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required', jwtToken: '' });
    }
    if (caloriesPerUnit === undefined || caloriesPerUnit === null) {
      return res.status(400).json({ error: 'caloriesPerUnit is required', jwtToken: '' });
    }
    if (!unit || !unit.trim()) {
      return res.status(400).json({ error: 'unit is required', jwtToken: '' });
    }

    const calories = parseFloat(caloriesPerUnit);
    if (isNaN(calories) || calories < 0) {
      return res.status(400).json({ error: 'caloriesPerUnit must be a valid positive number', jwtToken: '' });
    }

    let error = '';
    let foodId = null;
    try {
      const lastFood = await Food.findOne().sort({ FoodID: -1 }).lean();
      const nextFoodId = lastFood ? lastFood.FoodID + 1 : 1;

      const newFood = new Food({
        FoodID: nextFoodId,
        UserID: userId,
        Name: name.trim(),
        CaloriesPerUnit: calories,
        Unit: unit.trim(),
        UPC: upc || null
      });

      await newFood.save();
      foodId = nextFoodId;
    } catch (e) {
      console.error(e);
      error = e.toString();
    }

    let refreshedToken = '';
    try {
      const rt = token.refresh(jwtToken);
      refreshedToken = rt && rt.accessToken ? rt.accessToken : '';
    } catch (e) {
      console.log(e.message);
    }

    return res.status(200).json({ error, foodId, jwtToken: refreshedToken });
  });

  // ------------------ /api/editfood ------------------
  // incoming: { userId, foodId, name?, caloriesPerUnit?, unit?, jwtToken }
  // outgoing: { error, jwtToken }
  app.post('/api/editfood', async (req, res) => {
    const { userId, foodId, name, caloriesPerUnit, unit, jwtToken } = req.body;

    try {
      if (token.isExpired(jwtToken)) {
        return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
      }
    } catch (e) {
      console.log(e.message);
    }

    if (userId === undefined || userId === null) {
      return res.status(400).json({ error: 'userId is required', jwtToken: '' });
    }
    if (foodId === undefined || foodId === null) {
      return res.status(400).json({ error: 'foodId is required', jwtToken: '' });
    }

    let error = '';
    try {
      const food = await Food.findOne({ FoodID: foodId, UserID: userId });
      if (!food) {
        return res.status(404).json({ error: 'Food not found or does not belong to user', jwtToken: '' });
      }

      const updateFields = {};
      if (name !== undefined && name.trim()) updateFields.Name = name.trim();
      if (caloriesPerUnit !== undefined) {
        const calories = parseFloat(caloriesPerUnit);
        if (isNaN(calories) || calories < 0) {
          return res.status(400).json({ error: 'caloriesPerUnit must be a valid positive number', jwtToken: '' });
        }
        updateFields.CaloriesPerUnit = calories;
      }
      if (unit !== undefined && unit.trim()) updateFields.Unit = unit.trim();

      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ error: 'At least one field to update is required', jwtToken: '' });
      }

      await Food.findOneAndUpdate({ FoodID: foodId, UserID: userId }, updateFields);
    } catch (e) {
      console.error(e);
      error = e.toString();
    }

    let refreshedToken = '';
    try {
      const rt = token.refresh(jwtToken);
      refreshedToken = rt && rt.accessToken ? rt.accessToken : '';
    } catch (e) {
      console.log(e.message);
    }

    return res.status(200).json({ error, jwtToken: refreshedToken });
  });

  // ------------------ /api/deletefood ------------------
  // incoming: { userId, foodId, jwtToken }
  // outgoing: { error, jwtToken }
  app.post('/api/deletefood', async (req, res) => {
    const { userId, foodId, jwtToken } = req.body;

    try {
      if (token.isExpired(jwtToken)) {
        return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
      }
    } catch (e) {
      console.log(e.message);
    }

    if (userId === undefined || userId === null) {
      return res.status(400).json({ error: 'userId is required', jwtToken: '' });
    }
    if (foodId === undefined || foodId === null) {
      return res.status(400).json({ error: 'foodId is required', jwtToken: '' });
    }

    let error = '';
    try {
      const result = await Food.findOneAndDelete({ FoodID: foodId, UserID: userId });
      if (!result) {
        return res.status(404).json({ error: 'Food not found or does not belong to user', jwtToken: '' });
      }
    } catch (e) {
      console.error(e);
      error = e.toString();
    }

    let refreshedToken = '';
    try {
      const rt = token.refresh(jwtToken);
      refreshedToken = rt && rt.accessToken ? rt.accessToken : '';
    } catch (e) {
      console.log(e.message);
    }

    return res.status(200).json({ error, jwtToken: refreshedToken });
  });

  // ------------------ /api/searchfood ------------------
  // incoming: { userId, search, jwtToken }
  // outgoing: { results: Food[], error, jwtToken }
  app.post('/api/searchfood', async (req, res) => {
    const { userId, search, jwtToken } = req.body;

    try {
      if (token.isExpired(jwtToken)) {
        return res.status(200).json({ error: 'The JWT is no longer valid', results: [], jwtToken: '' });
      }
    } catch (e) {
      console.log(e.message);
    }

    if (userId === undefined || userId === null) {
      return res.status(400).json({ error: 'userId is required', results: [], jwtToken: '' });
    }

    const _search = (search || '').trim();

    try {
      const query = { UserID: userId };
      if (_search) {
        query.Name = { $regex: _search, $options: 'i' };
      }

      const foods = await Food.find(query)
        .select({ FoodID: 1, Name: 1, CaloriesPerUnit: 1, Unit: 1, UPC: 1, _id: 0 })
        .lean();

      let refreshedToken = '';
      try {
        const rt = token.refresh(jwtToken);
        refreshedToken = rt && rt.accessToken ? rt.accessToken : '';
      } catch (e) {
        console.log(e.message);
      }

      return res.status(200).json({ results: foods, error: '', jwtToken: refreshedToken });
    } catch (e) {
      console.error(e);

      let refreshedToken = '';
      try {
        const rt = token.refresh(jwtToken);
        refreshedToken = rt && rt.accessToken ? rt.accessToken : '';
      } catch (e2) {
        console.log(e2.message);
      }

      return res.status(500).json({ results: [], error: 'server error', jwtToken: refreshedToken });
    }
  });

  // ==================== DAY ENDPOINTS ====================

  // ------------------ /api/addday ------------------
  // incoming: { userId, date, jwtToken }
  // outgoing: { error, dayId?, jwtToken }
  app.post('/api/addday', async (req, res) => {
    const { userId, date, jwtToken } = req.body;

    try {
      if (token.isExpired(jwtToken)) {
        return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
      }
    } catch (e) {
      console.log(e.message);
    }

    if (userId === undefined || userId === null) {
      return res.status(400).json({ error: 'userId is required', jwtToken: '' });
    }
    if (!date) {
      return res.status(400).json({ error: 'date is required', jwtToken: '' });
    }

    let error = '';
    let dayId = null;
    try {
      const dayDate = new Date(date);
      if (isNaN(dayDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format', jwtToken: '' });
      }

      // Check if day already exists for this user and date
      const existingDay = await Day.findOne({ UserID: userId, Date: dayDate });
      if (existingDay) {
        return res.status(409).json({ error: 'Day already exists for this date', dayId: existingDay.DayID, jwtToken: '' });
      }

      const lastDay = await Day.findOne().sort({ DayID: -1 }).lean();
      const nextDayId = lastDay ? lastDay.DayID + 1 : 1;

      const newDay = new Day({
        DayID: nextDayId,
        UserID: userId,
        Date: dayDate,
        Entries: []
      });

      await newDay.save();
      dayId = nextDayId;
    } catch (e) {
      console.error(e);
      error = e.toString();
    }

    let refreshedToken = '';
    try {
      const rt = token.refresh(jwtToken);
      refreshedToken = rt && rt.accessToken ? rt.accessToken : '';
    } catch (e) {
      console.log(e.message);
    }

    return res.status(200).json({ error, dayId, jwtToken: refreshedToken });
  });

  // ------------------ /api/editday ------------------
  // incoming: { userId, dayId, date?, jwtToken }
  // outgoing: { error, jwtToken }
  app.post('/api/editday', async (req, res) => {
    const { userId, dayId, date, jwtToken } = req.body;

    try {
      if (token.isExpired(jwtToken)) {
        return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
      }
    } catch (e) {
      console.log(e.message);
    }

    if (userId === undefined || userId === null) {
      return res.status(400).json({ error: 'userId is required', jwtToken: '' });
    }
    if (dayId === undefined || dayId === null) {
      return res.status(400).json({ error: 'dayId is required', jwtToken: '' });
    }

    let error = '';
    try {
      const day = await Day.findOne({ DayID: dayId, UserID: userId });
      if (!day) {
        return res.status(404).json({ error: 'Day not found or does not belong to user', jwtToken: '' });
      }

      if (date) {
        const dayDate = new Date(date);
        if (isNaN(dayDate.getTime())) {
          return res.status(400).json({ error: 'Invalid date format', jwtToken: '' });
        }
        await Day.findOneAndUpdate({ DayID: dayId, UserID: userId }, { Date: dayDate });
      } else {
        return res.status(400).json({ error: 'At least one field to update is required', jwtToken: '' });
      }
    } catch (e) {
      console.error(e);
      error = e.toString();
    }

    let refreshedToken = '';
    try {
      const rt = token.refresh(jwtToken);
      refreshedToken = rt && rt.accessToken ? rt.accessToken : '';
    } catch (e) {
      console.log(e.message);
    }

    return res.status(200).json({ error, jwtToken: refreshedToken });
  });

  // ------------------ /api/deleteday ------------------
  // incoming: { userId, dayId, jwtToken }
  // outgoing: { error, jwtToken }
  app.post('/api/deleteday', async (req, res) => {
    const { userId, dayId, jwtToken } = req.body;

    try {
      if (token.isExpired(jwtToken)) {
        return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
      }
    } catch (e) {
      console.log(e.message);
    }

    if (userId === undefined || userId === null) {
      return res.status(400).json({ error: 'userId is required', jwtToken: '' });
    }
    if (dayId === undefined || dayId === null) {
      return res.status(400).json({ error: 'dayId is required', jwtToken: '' });
    }

    let error = '';
    try {
      const result = await Day.findOneAndDelete({ DayID: dayId, UserID: userId });
      if (!result) {
        return res.status(404).json({ error: 'Day not found or does not belong to user', jwtToken: '' });
      }
    } catch (e) {
      console.error(e);
      error = e.toString();
    }

    let refreshedToken = '';
    try {
      const rt = token.refresh(jwtToken);
      refreshedToken = rt && rt.accessToken ? rt.accessToken : '';
    } catch (e) {
      console.log(e.message);
    }

    return res.status(200).json({ error, jwtToken: refreshedToken });
  });

  // ------------------ /api/searchdays ------------------
  // incoming: { userId, startDate?, endDate?, jwtToken }
  // outgoing: { results: Day[], error, jwtToken }
  app.post('/api/searchdays', async (req, res) => {
    const { userId, startDate, endDate, jwtToken } = req.body;

    try {
      if (token.isExpired(jwtToken)) {
        return res.status(200).json({ error: 'The JWT is no longer valid', results: [], jwtToken: '' });
      }
    } catch (e) {
      console.log(e.message);
    }

    if (userId === undefined || userId === null) {
      return res.status(400).json({ error: 'userId is required', results: [], jwtToken: '' });
    }

    try {
      const query = { UserID: userId };
      
      if (startDate || endDate) {
        query.Date = {};
        if (startDate) {
          const start = new Date(startDate);
          if (isNaN(start.getTime())) {
            return res.status(400).json({ error: 'Invalid startDate format', results: [], jwtToken: '' });
          }
          query.Date.$gte = start;
        }
        if (endDate) {
          const end = new Date(endDate);
          if (isNaN(end.getTime())) {
            return res.status(400).json({ error: 'Invalid endDate format', results: [], jwtToken: '' });
          }
          query.Date.$lte = end;
        }
      }

      const days = await Day.find(query)
        .select({ DayID: 1, Date: 1, Entries: 1, _id: 0 })
        .sort({ Date: -1 })
        .lean();

      let refreshedToken = '';
      try {
        const rt = token.refresh(jwtToken);
        refreshedToken = rt && rt.accessToken ? rt.accessToken : '';
      } catch (e) {
        console.log(e.message);
      }

      return res.status(200).json({ results: days, error: '', jwtToken: refreshedToken });
    } catch (e) {
      console.error(e);

      let refreshedToken = '';
      try {
        const rt = token.refresh(jwtToken);
        refreshedToken = rt && rt.accessToken ? rt.accessToken : '';
      } catch (e2) {
        console.log(e2.message);
      }

      return res.status(500).json({ results: [], error: 'server error', jwtToken: refreshedToken });
    }
  });

  // ==================== ENTRY ENDPOINTS ====================

  // ------------------ /api/addentry ------------------
  // incoming: { userId, dayId, foodId, amount, jwtToken }
  // outgoing: { error, entryId?, jwtToken }
  app.post('/api/addentry', async (req, res) => {
    const { userId, dayId, foodId, amount, jwtToken } = req.body;

    try {
      if (token.isExpired(jwtToken)) {
        return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
      }
    } catch (e) {
      console.log(e.message);
    }

    if (userId === undefined || userId === null) {
      return res.status(400).json({ error: 'userId is required', jwtToken: '' });
    }
    if (dayId === undefined || dayId === null) {
      return res.status(400).json({ error: 'dayId is required', jwtToken: '' });
    }
    if (foodId === undefined || foodId === null) {
      return res.status(400).json({ error: 'foodId is required', jwtToken: '' });
    }
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'amount is required', jwtToken: '' });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'amount must be a valid positive number', jwtToken: '' });
    }

    let error = '';
    let entryId = null;
    try {
      const day = await Day.findOne({ DayID: dayId, UserID: userId });
      if (!day) {
        return res.status(404).json({ error: 'Day not found or does not belong to user', jwtToken: '' });
      }

      // Verify food exists and belongs to user
      const food = await Food.findOne({ FoodID: foodId, UserID: userId });
      if (!food) {
        return res.status(404).json({ error: 'Food not found or does not belong to user', jwtToken: '' });
      }

      const newEntry = {
        FoodID: foodId,
        Amount: amountNum,
        Timestamp: new Date()
      };

      day.Entries.push(newEntry);
      await day.save();

      entryId = day.Entries[day.Entries.length - 1]._id.toString();
    } catch (e) {
      console.error(e);
      error = e.toString();
    }

    let refreshedToken = '';
    try {
      const rt = token.refresh(jwtToken);
      refreshedToken = rt && rt.accessToken ? rt.accessToken : '';
    } catch (e) {
      console.log(e.message);
    }

    return res.status(200).json({ error, entryId, jwtToken: refreshedToken });
  });

  // ------------------ /api/editentry ------------------
  // incoming: { userId, dayId, entryId, foodId?, amount?, jwtToken }
  // outgoing: { error, jwtToken }
  app.post('/api/editentry', async (req, res) => {
    const { userId, dayId, entryId, foodId, amount, jwtToken } = req.body;

    try {
      if (token.isExpired(jwtToken)) {
        return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
      }
    } catch (e) {
      console.log(e.message);
    }

    if (userId === undefined || userId === null) {
      return res.status(400).json({ error: 'userId is required', jwtToken: '' });
    }
    if (dayId === undefined || dayId === null) {
      return res.status(400).json({ error: 'dayId is required', jwtToken: '' });
    }
    if (!entryId) {
      return res.status(400).json({ error: 'entryId is required', jwtToken: '' });
    }

    let error = '';
    try {
      const day = await Day.findOne({ DayID: dayId, UserID: userId });
      if (!day) {
        return res.status(404).json({ error: 'Day not found or does not belong to user', jwtToken: '' });
      }

      const entry = day.Entries.id(entryId);
      if (!entry) {
        return res.status(404).json({ error: 'Entry not found in this day', jwtToken: '' });
      }

      let updated = false;

      if (foodId !== undefined) {
        const food = await Food.findOne({ FoodID: foodId, UserID: userId });
        if (!food) {
          return res.status(404).json({ error: 'Food not found or does not belong to user', jwtToken: '' });
        }
        entry.FoodID = foodId;
        updated = true;
      }

      if (amount !== undefined) {
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          return res.status(400).json({ error: 'amount must be a valid positive number', jwtToken: '' });
        }
        entry.Amount = amountNum;
        updated = true;
      }

      if (!updated) {
        return res.status(400).json({ error: 'At least one field to update is required', jwtToken: '' });
      }

      await day.save();
    } catch (e) {
      console.error(e);
      error = e.toString();
    }

    let refreshedToken = '';
    try {
      const rt = token.refresh(jwtToken);
      refreshedToken = rt && rt.accessToken ? rt.accessToken : '';
    } catch (e) {
      console.log(e.message);
    }

    return res.status(200).json({ error, jwtToken: refreshedToken });
  });

  // ------------------ /api/deleteentry ------------------
  // incoming: { userId, dayId, entryId, jwtToken }
  // outgoing: { error, jwtToken }
  app.post('/api/deleteentry', async (req, res) => {
    const { userId, dayId, entryId, jwtToken } = req.body;

    try {
      if (token.isExpired(jwtToken)) {
        return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
      }
    } catch (e) {
      console.log(e.message);
    }

    if (userId === undefined || userId === null) {
      return res.status(400).json({ error: 'userId is required', jwtToken: '' });
    }
    if (dayId === undefined || dayId === null) {
      return res.status(400).json({ error: 'dayId is required', jwtToken: '' });
    }
    if (!entryId) {
      return res.status(400).json({ error: 'entryId is required', jwtToken: '' });
    }

    let error = '';
    try {
      const day = await Day.findOne({ DayID: dayId, UserID: userId });
      if (!day) {
        return res.status(404).json({ error: 'Day not found or does not belong to user', jwtToken: '' });
      }

      const entry = day.Entries.id(entryId);
      if (!entry) {
        return res.status(404).json({ error: 'Entry not found in this day', jwtToken: '' });
      }

      entry.remove();
      await day.save();
    } catch (e) {
      console.error(e);
      error = e.toString();
    }

    let refreshedToken = '';
    try {
      const rt = token.refresh(jwtToken);
      refreshedToken = rt && rt.accessToken ? rt.accessToken : '';
    } catch (e) {
      console.log(e.message);
    }

    return res.status(200).json({ error, jwtToken: refreshedToken });
  });

};