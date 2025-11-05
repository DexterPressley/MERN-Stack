// backend/routes/dayRoutes.js
const express = require('express');
const router = express.Router();
const dayController = require('../controllers/dayController');
const authMiddleware = require('../middleware/authMiddleware');
const tokenRefresh = require('../middleware/tokenRefresh');

// All day routes require authentication
router.get('/users/:userId/days', 
  authMiddleware, 
  tokenRefresh, 
  dayController.getDays
);

router.get('/users/:userId/days/:dayId', 
  authMiddleware, 
  tokenRefresh, 
  dayController.getDayById
);

router.post('/users/:userId/days', 
  authMiddleware, 
  tokenRefresh, 
  dayController.addDay
);

router.patch('/users/:userId/days/:dayId', 
  authMiddleware, 
  tokenRefresh, 
  dayController.updateDay
);

router.delete('/users/:userId/days/:dayId', 
  authMiddleware, 
  tokenRefresh, 
  dayController.deleteDay
);

module.exports = router;