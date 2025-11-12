// backend/controllers/entryController.js
const Day = require('../models/day');
const Food = require('../models/food');

// Add an entry to a day
exports.addEntry = async (req, res) => {
  const { userId, dayId } = req.params;
  const { foodId, amount, mealType } = req.body;

  if (foodId === undefined || foodId === null) {
    return res.status(400).json({ error: 'foodId is required' });
  }
  if (amount === undefined || amount === null) {
    return res.status(400).json({ error: 'amount is required' });
  }
  if (!mealType) {
    return res.status(400).json({ error: 'mealType is required' });
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return res.status(400).json({ error: 'amount must be a valid positive number' });
  }

  // Validate mealType
  const validMealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  if (!validMealTypes.includes(mealType)) {
    return res.status(400).json({ 
      error: `mealType must be one of: ${validMealTypes.join(', ')}` 
    });
  }

  try {
    const day = await Day.findOne({ 
      DayID: parseInt(dayId), 
      UserID: parseInt(userId) 
    });
    
    if (!day) {
      return res.status(404).json({ error: 'Day not found or does not belong to user' });
    }

    // Verify food exists and belongs to user
    const food = await Food.findOne({ 
      FoodID: parseInt(foodId), 
      UserID: parseInt(userId) 
    });
    
    if (!food) {
      return res.status(404).json({ error: 'Food not found or does not belong to user' });
    }

    const newEntry = {
      FoodID: parseInt(foodId),
      Amount: amountNum,
      MealType: mealType,
      Timestamp: new Date()
    };

    day.Entries.push(newEntry);
    await day.save();

    const addedEntry = day.Entries[day.Entries.length - 1];
    const entryId = addedEntry._id.toString();
    
    // ⚠️ CRITICAL: Return enriched entry with food details
    return res.status(201).json({ 
      success: true,
      message: 'Entry added successfully',
      entry: {
        entryId,
        _id: entryId,
        foodId: parseInt(foodId),
        FoodID: parseInt(foodId),
        foodName: food.Name,
        amount: amountNum,
        Amount: amountNum,
        mealType: mealType,
        MealType: mealType,
        caloriesPerUnit: food.CaloriesPerUnit,
        proteinPerUnit: food.ProteinPerUnit,
        carbsPerUnit: food.CarbsPerUnit,
        fatPerUnit: food.FatPerUnit,
        unit: food.Unit,
        calories: Math.round(food.CaloriesPerUnit * amountNum),
        protein: Math.round(food.ProteinPerUnit * amountNum),
        carbs: Math.round(food.CarbsPerUnit * amountNum),
        fat: Math.round(food.FatPerUnit * amountNum),
        timestamp: addedEntry.Timestamp,
        Timestamp: addedEntry.Timestamp
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error adding entry' });
  }
};

// Update an entry
exports.updateEntry = async (req, res) => {
  const { userId, dayId, entryId } = req.params;
  const { foodId, amount, mealType } = req.body;

  try {
    const day = await Day.findOne({ 
      DayID: parseInt(dayId), 
      UserID: parseInt(userId) 
    });
    
    if (!day) {
      return res.status(404).json({ error: 'Day not found or does not belong to user' });
    }

    const entry = day.Entries.id(entryId);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found in this day' });
    }

    let updated = false;
    let food = null;

    if (foodId !== undefined) {
      food = await Food.findOne({ 
        FoodID: parseInt(foodId), 
        UserID: parseInt(userId) 
      });
      
      if (!food) {
        return res.status(404).json({ error: 'Food not found or does not belong to user' });
      }
      entry.FoodID = parseInt(foodId);
      updated = true;
    }

    if (amount !== undefined) {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ error: 'amount must be a valid positive number' });
      }
      entry.Amount = amountNum;
      updated = true;
    }

    if (mealType !== undefined) {
      const validMealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
      if (!validMealTypes.includes(mealType)) {
        return res.status(400).json({ 
          error: `mealType must be one of: ${validMealTypes.join(', ')}` 
        });
      }
      entry.MealType = mealType;
      updated = true;
    }

    if (!updated) {
      return res.status(400).json({ error: 'At least one field to update is required' });
    }

    await day.save();
    
    // Get food details for enriched response
    if (!food) {
      food = await Food.findOne({ 
        FoodID: entry.FoodID, 
        UserID: parseInt(userId) 
      });
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Entry updated successfully',
      entry: {
        entryId: entry._id.toString(),
        _id: entry._id.toString(),
        foodId: entry.FoodID,
        FoodID: entry.FoodID,
        foodName: food.Name,
        amount: entry.Amount,
        Amount: entry.Amount,
        mealType: entry.MealType,
        MealType: entry.MealType,
        caloriesPerUnit: food.CaloriesPerUnit,
        proteinPerUnit: food.ProteinPerUnit,
        carbsPerUnit: food.CarbsPerUnit,
        fatPerUnit: food.FatPerUnit,
        unit: food.Unit,
        calories: Math.round(food.CaloriesPerUnit * entry.Amount),
        protein: Math.round(food.ProteinPerUnit * entry.Amount),
        carbs: Math.round(food.CarbsPerUnit * entry.Amount),
        fat: Math.round(food.FatPerUnit * entry.Amount),
        timestamp: entry.Timestamp,
        Timestamp: entry.Timestamp
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error updating entry' });
  }
};

// Delete an entry
exports.deleteEntry = async (req, res) => {
  const { userId, dayId, entryId } = req.params;

  try {
    const day = await Day.findOne({ 
      DayID: parseInt(dayId), 
      UserID: parseInt(userId) 
    });
    
    if (!day) {
      return res.status(404).json({ error: 'Day not found or does not belong to user' });
    }

    const entry = day.Entries.id(entryId);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found in this day' });
    }

    day.Entries.pull(entryId);
    await day.save();
    
    return res.status(200).json({ 
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error deleting entry' });
  }
};
