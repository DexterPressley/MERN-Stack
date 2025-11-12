// backend/controllers/dayController.js
const Day = require('../models/day');
const Food = require('../models/food');

// Get days (with optional date range filtering)
exports.getDays = async (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    const query = { UserID: parseInt(userId) };
    
    if (startDate || endDate) {
      query.Date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({ error: 'Invalid startDate format' });
        }
        query.Date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({ error: 'Invalid endDate format' });
        }
        query.Date.$lte = end;
      }
    }

    const days = await Day.find(query)
      .select({ DayID: 1, Date: 1, Entries: 1 })
      .sort({ Date: -1 })
      .lean();

    // ⚠️ CRITICAL: Enrich entries with food details
    for (let day of days) {
      if (day.Entries && day.Entries.length > 0) {
        for (let entry of day.Entries) {
          const food = await Food.findOne({ 
            FoodID: entry.FoodID, 
            UserID: parseInt(userId) 
          }).lean();
          
          if (food) {
            // Add food details to entry
            entry.foodName = food.Name;
            entry.caloriesPerUnit = food.CaloriesPerUnit;
            entry.proteinPerUnit = food.ProteinPerUnit;
            entry.carbsPerUnit = food.CarbsPerUnit;
            entry.fatPerUnit = food.FatPerUnit;
            entry.unit = food.Unit;
            
            // Calculate totals based on amount
            entry.calories = Math.round(food.CaloriesPerUnit * entry.Amount);
            entry.protein = Math.round(food.ProteinPerUnit * entry.Amount);
            entry.carbs = Math.round(food.CarbsPerUnit * entry.Amount);
            entry.fat = Math.round(food.FatPerUnit * entry.Amount);
          } else {
            // Food not found, set defaults
            entry.foodName = 'Unknown Food';
            entry.calories = 0;
            entry.protein = 0;
            entry.carbs = 0;
            entry.fat = 0;
          }
        }
      }
    }

    return res.status(200).json({ 
      success: true,
      results: days,
      count: days.length
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error searching days' });
  }
};

// Get a single day by ID
exports.getDayById = async (req, res) => {
  const { userId, dayId } = req.params;

  try {
    const day = await Day.findOne({ 
      DayID: parseInt(dayId), 
      UserID: parseInt(userId) 
    })
    .select({ DayID: 1, Date: 1, Entries: 1 })
    .lean();

    if (!day) {
      return res.status(404).json({ error: 'Day not found or does not belong to user' });
    }

    // ⚠️ CRITICAL: Enrich entries with food details
    if (day.Entries && day.Entries.length > 0) {
      for (let entry of day.Entries) {
        const food = await Food.findOne({ 
          FoodID: entry.FoodID, 
          UserID: parseInt(userId) 
        }).lean();
        
        if (food) {
          entry.foodName = food.Name;
          entry.caloriesPerUnit = food.CaloriesPerUnit;
          entry.proteinPerUnit = food.ProteinPerUnit;
          entry.carbsPerUnit = food.CarbsPerUnit;
          entry.fatPerUnit = food.FatPerUnit;
          entry.unit = food.Unit;
          entry.calories = Math.round(food.CaloriesPerUnit * entry.Amount);
          entry.protein = Math.round(food.ProteinPerUnit * entry.Amount);
          entry.carbs = Math.round(food.CarbsPerUnit * entry.Amount);
          entry.fat = Math.round(food.FatPerUnit * entry.Amount);
        } else {
          entry.foodName = 'Unknown Food';
          entry.calories = 0;
          entry.protein = 0;
          entry.carbs = 0;
          entry.fat = 0;
        }
      }
    }

    return res.status(200).json({ 
      success: true,
      day
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error retrieving day' });
  }
};

// Add a new day
exports.addDay = async (req, res) => {
  const { userId } = req.params;
  const { date } = req.body;

  if (!date) {
    return res.status(400).json({ error: 'date is required' });
  }

  try {
    const dayDate = new Date(date);
    if (isNaN(dayDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Check if day already exists for this user and date
    const existingDay = await Day.findOne({ 
      UserID: parseInt(userId), 
      Date: dayDate 
    });
    
    if (existingDay) {
      return res.status(409).json({ 
        error: 'Day already exists for this date',
        dayId: existingDay.DayID
      });
    }

    const lastDay = await Day.findOne().sort({ DayID: -1 }).lean();
    const nextDayId = lastDay ? lastDay.DayID + 1 : 1;

    const newDay = new Day({
      DayID: nextDayId,
      UserID: parseInt(userId),
      Date: dayDate,
      Entries: []
    });

    await newDay.save();
    
    return res.status(201).json({ 
      success: true,
      message: 'Day added successfully',
      day: {
        dayId: nextDayId,
        date: dayDate
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error adding day' });
  }
};

// Update a day
exports.updateDay = async (req, res) => {
  const { userId, dayId } = req.params;
  const { date } = req.body;

  if (!date) {
    return res.status(400).json({ error: 'date is required' });
  }

  try {
    const day = await Day.findOne({ 
      DayID: parseInt(dayId), 
      UserID: parseInt(userId) 
    });
    
    if (!day) {
      return res.status(404).json({ error: 'Day not found or does not belong to user' });
    }

    const dayDate = new Date(date);
    if (isNaN(dayDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const updatedDay = await Day.findOneAndUpdate(
      { DayID: parseInt(dayId), UserID: parseInt(userId) },
      { Date: dayDate },
      { new: true }
    );
    
    return res.status(200).json({ 
      success: true,
      message: 'Day updated successfully',
      day: {
        dayId: updatedDay.DayID,
        date: updatedDay.Date
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error updating day' });
  }
};

// Delete a day
exports.deleteDay = async (req, res) => {
  const { userId, dayId } = req.params;

  try {
    const result = await Day.findOneAndDelete({ 
      DayID: parseInt(dayId), 
      UserID: parseInt(userId) 
    });
    
    if (!result) {
      return res.status(404).json({ error: 'Day not found or does not belong to user' });
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Day deleted successfully'
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error deleting day' });
  }
};
