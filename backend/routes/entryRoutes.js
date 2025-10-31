// backend/routes/entryRoutes.js
const express = require('express');
const router = express.Router();
const entryController = require('../controllers/entryController');
const authMiddleware = require('../middleware/authMiddleware');
const tokenRefresh = require('../middleware/tokenRefresh');

// All entry routes require authentication
router.post('/users/:userId/days/:dayId/entries', 
  authMiddleware, 
  tokenRefresh, 
  entryController.addEntry
);

router.patch('/users/:userId/days/:dayId/entries/:entryId', 
  authMiddleware, 
  tokenRefresh, 
  entryController.updateEntry
);

router.delete('/users/:userId/days/:dayId/entries/:entryId', 
  authMiddleware, 
  tokenRefresh, 
  entryController.deleteEntry
);

module.exports = router;