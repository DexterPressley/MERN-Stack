// cards/api.js
require('express');
require('mongodb'); // harmless; not needed once on Mongoose

const bcrypt = require('bcryptjs');
const token = require('./createJWT.js');
const User  = require('./models/user.js');
const Card  = require('./models/card.js');

exports.setApp = function (app, _mongoose) {

  //------------------ /api/register ------------------
  // incoming: { firstName, lastName, email, password }
  // outgoing: { success: boolean, message: string, userId?: number }
  app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required (firstName, lastName, email, password)' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Check if user already exists (by email)
    const existingUser = await User.findOne({ Email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get next UserID (auto-increment)
    const lastUser = await User.findOne().sort({ UserID: -1 }).lean();
    const nextUserId = lastUser ? lastUser.UserID + 1 : 1;

    // Create new user with hashed password
    const newUser = new User({
      UserID: nextUserId,
      FirstName: firstName,
      LastName: lastName,
      Email: email.toLowerCase(),
      Password: hashedPassword,
      Login: email.toLowerCase(),
      IsVerified: false,
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
  // incoming: { login, password }
  // outgoing: { accessToken } | { error }
// /api/login
app.post('/api/login', async (req, res) => {
  let { login, password } = req.body;

  // Normalize inputs to avoid hidden whitespace issues
  login = (login || '').trim();
  password = (password || '').trim();

  if (!login || !password) {
    return res.status(400).json({ error: 'login and password are required' });
  }

  try {
    // Compare exact match on login field(before password check)
    const u = await User.findOne({ Login: login }).lean();

    if (!u) {
      // Log once while debugging (remove later)
      console.log('Login not found for:', { login, passwordLength: password.length });
      return res.status(200).json({ error: 'Login/Password incorrect' });
    }

    // Compare password with hashed password
    const isValidPassword = await bcrypt.compare(password, u.Password);
    if (!isValidPassword) {
        return res.status(200).json({ error: 'Login/Password incorrect' });
      }

      //email verification check, not implemented yet
  // if (!u.IsVerified) {
  //   return res.status(200).json({ error: 'Please verify your email before logging in' });
  // }

    const id = u.UserID;
    const fn = u.FirstName;
    const ln = u.LastName;

    try {
      const ret = token.createToken(fn, ln, id); // { accessToken } or { error }
      return res.status(200).json(ret);
    } catch (e) {
      return res.status(200).json({ error: e.message });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});


  // ------------------ /api/addcard ------------------
  // incoming: { userId, card, jwtToken }
  // outgoing: { error, jwtToken }
  app.post('/api/addcard', async (req, res) => {
    const { userId, card, jwtToken } = req.body;

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
    if (typeof card !== 'string' || !card.trim()) {
      return res.status(400).json({ error: 'card is required', jwtToken: '' });
    }

    let error = '';
    try {
      const newCard = new Card({ Card: card, UserID: userId }); // Mongoose doc with UserID
      await newCard.save();
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

  // ------------------ /api/searchcards ------------------
  // incoming: { userId, search, jwtToken }
  // outgoing: { results: string[], error, jwtToken }
  app.post('/api/searchcards', async (req, res) => {
    const { userId, search, jwtToken } = req.body;

    try {
      if (token.isExpired(jwtToken)) {
        return res.status(200).json({ error: 'The JWT is no longer valid', results: [], jwtToken: '' });
      }
    } catch (e) {
      console.log(e.message);
    }

    const _search = (search || '').trim();

    try {
      // Use case-insensitive search. ('i' is the valid option; 'r' is not)
      const docs = await Card.find({ Card: { $regex: _search + '.*', $options: 'i' } })
        .select({ Card: 1, _id: 0 })
        .lean();

      const list = (docs || []).map(d => d.Card);

      let refreshedToken = '';
      try {
        const rt = token.refresh(jwtToken);
        refreshedToken = rt && rt.accessToken ? rt.accessToken : '';
      } catch (e) {
        console.log(e.message);
      }

      return res.status(200).json({ results: list, error: '', jwtToken: refreshedToken });
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

};

