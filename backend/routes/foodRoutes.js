// backend/routes/foodRoutes.js
const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const authMiddleware = require('../middleware/authMiddleware');
const tokenRefresh = require('../middleware/tokenRefresh');

// All food routes require authentication
router.get('/users/:userId/foods', 
  authMiddleware, 
  tokenRefresh, 
  foodController.getFoods
);

router.post('/users/:userId/foods', 
  authMiddleware, 
  tokenRefresh, 
  foodController.addFood
);

router.patch('/users/:userId/foods/:foodId', 
  authMiddleware, 
  tokenRefresh, 
  foodController.updateFood
);

router.delete('/users/:userId/foods/:foodId', 
  authMiddleware, 
  tokenRefresh, 
  foodController.deleteFood
);

module.exports = router;