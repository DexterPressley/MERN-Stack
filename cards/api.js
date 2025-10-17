// cards/api.js
require('express');
require('mongodb'); // harmless; not needed once on Mongoose

const token = require('./createJWT.js');
const User  = require('./models/user.js');
const Card  = require('./models/card.js');

exports.setApp = function (app, _mongoose) {
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
    // exact match on both fields
    const u = await User.findOne({ Login: login, Password: password }).lean();

    if (!u) {
      // Log once while debugging (remove later)
      console.log('Login not found for:', { login, passwordLength: password.length });
      return res.status(200).json({ error: 'Login/Password incorrect' });
    }

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

// TEMP DEBUG: remove after testing
app.get('/api/_debug', async (req, res) => {
  try {
    const uCount = await require('./models/user').countDocuments();
    const cCount = await require('./models/card').countDocuments();
    const oneUser = await require('./models/user').findOne({}).lean();
    res.json({
      db: require('mongoose').connection.name,            // which DB?
      usersCollection: require('./models/user').collection.name,
      cardsCollection: require('./models/card').collection.name,
      usersCount: uCount,
      cardsCount: cCount,
      sampleUser: oneUser ? Object.keys(oneUser) : null,  // show field names
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});


};

