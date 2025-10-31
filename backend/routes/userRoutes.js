// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const tokenRefresh = require('../middleware/tokenRefresh');

// Public routes (no auth required)
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes (auth required)
router.patch('/users/:userId/calorie-goal', 
  authMiddleware, 
  tokenRefresh, 
  userController.updateCalorieGoal
);

router.patch('/users/:userId/rollover-time', 
  authMiddleware, 
  tokenRefresh, 
  userController.editDayRolloverTime
);

router.patch('/users/:userId/macro-goals', 
  authMiddleware, 
  tokenRefresh, 
  userController.updateMacroGoals
);

module.exports = router;