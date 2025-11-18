// backend/controllers/foodController.js
const Food = require('../models/food');

// Get all foods or search foods (GET with query params)
exports.getFoods = async (req, res) => {
  const { userId } = req.params;
  const { search } = req.query;

  try {
    const query = { UserID: {
      $in: [parseInt(userId), 1]}};
    if (search) {
      query.Name = { $regex: search, $options: 'i' };
    }

    const foods = await Food.find(query)
      .select({ 
        FoodID: 1, 
        Name: 1, 
        CaloriesPerUnit: 1, 
        ProteinPerUnit: 1,
        CarbsPerUnit: 1,
        FatPerUnit: 1,
        Unit: 1, 
        UPC: 1, 
        CreatedAt: 1, 
        _id: 0 
      })
      .lean();

    return res.status(200).json({ 
      success: true,
      results: foods,
      count: foods.length
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error searching foods' });
  }
};

// Add a new food
exports.addFood = async (req, res) => {
  const { userId } = req.params;
  const { name, caloriesPerUnit, proteinPerUnit, carbsPerUnit, fatPerUnit, unit, upc } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (caloriesPerUnit === undefined || caloriesPerUnit === null) {
    return res.status(400).json({ error: 'caloriesPerUnit is required' });
  }
  if (proteinPerUnit === undefined || proteinPerUnit === null) {
    return res.status(400).json({ error: 'proteinPerUnit is required' });
  }
  if (carbsPerUnit === undefined || carbsPerUnit === null) {
    return res.status(400).json({ error: 'carbsPerUnit is required' });
  }
  if (fatPerUnit === undefined || fatPerUnit === null) {
    return res.status(400).json({ error: 'fatPerUnit is required' });
  }
  if (!unit || !unit.trim()) {
    return res.status(400).json({ error: 'unit is required' });
  }

  const calories = parseFloat(caloriesPerUnit);
  const protein = parseFloat(proteinPerUnit);
  const carbs = parseFloat(carbsPerUnit);
  const fat = parseFloat(fatPerUnit);

  if (isNaN(calories) || calories < 0) {
    return res.status(400).json({ error: 'caloriesPerUnit must be a valid positive number' });
  }
  if (isNaN(protein) || protein < 0) {
    return res.status(400).json({ error: 'proteinPerUnit must be a valid positive number' });
  }
  if (isNaN(carbs) || carbs < 0) {
    return res.status(400).json({ error: 'carbsPerUnit must be a valid positive number' });
  }
  if (isNaN(fat) || fat < 0) {
    return res.status(400).json({ error: 'fatPerUnit must be a valid positive number' });
  }

  try {
    const lastFood = await Food.findOne().sort({ FoodID: -1 }).lean();
    const nextFoodId = lastFood ? lastFood.FoodID + 1 : 1;

    const newFood = new Food({
      FoodID: nextFoodId,
      UserID: parseInt(userId),
      Name: name.trim(),
      CaloriesPerUnit: calories,
      ProteinPerUnit: protein,
      CarbsPerUnit: carbs,
      FatPerUnit: fat,
      Unit: unit.trim(),
      UPC: upc || null
    });

    await newFood.save();
    
    return res.status(201).json({ 
      success: true,
      message: 'Food added successfully',
      food: {
        foodId: nextFoodId,
        name: newFood.Name,
        caloriesPerUnit: newFood.CaloriesPerUnit,
        proteinPerUnit: newFood.ProteinPerUnit,
        carbsPerUnit: newFood.CarbsPerUnit,
        fatPerUnit: newFood.FatPerUnit,
        unit: newFood.Unit,
        upc: newFood.UPC
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error adding food' });
  }
};

// Update a food (PATCH for partial update)
exports.updateFood = async (req, res) => {
  const { userId, foodId } = req.params;
  const { name, caloriesPerUnit, proteinPerUnit, carbsPerUnit, fatPerUnit, unit } = req.body;

  try {
    const food = await Food.findOne({ 
      FoodID: parseInt(foodId), 
      UserID: parseInt(userId) 
    });
    
    if (!food) {
      return res.status(404).json({ error: 'Food not found or does not belong to user' });
    }

    const updateFields = {};
    
    if (name !== undefined && name.trim()) {
      updateFields.Name = name.trim();
    }
    
    if (caloriesPerUnit !== undefined) {
      const calories = parseFloat(caloriesPerUnit);
      if (isNaN(calories) || calories < 0) {
        return res.status(400).json({ error: 'caloriesPerUnit must be a valid positive number' });
      }
      updateFields.CaloriesPerUnit = calories;
    }
    
    if (proteinPerUnit !== undefined) {
      const protein = parseFloat(proteinPerUnit);
      if (isNaN(protein) || protein < 0) {
        return res.status(400).json({ error: 'proteinPerUnit must be a valid positive number' });
      }
      updateFields.ProteinPerUnit = protein;
    }
    
    if (carbsPerUnit !== undefined) {
      const carbs = parseFloat(carbsPerUnit);
      if (isNaN(carbs) || carbs < 0) {
        return res.status(400).json({ error: 'carbsPerUnit must be a valid positive number' });
      }
      updateFields.CarbsPerUnit = carbs;
    }
    
    if (fatPerUnit !== undefined) {
      const fat = parseFloat(fatPerUnit);
      if (isNaN(fat) || fat < 0) {
        return res.status(400).json({ error: 'fatPerUnit must be a valid positive number' });
      }
      updateFields.FatPerUnit = fat;
    }
    
    if (unit !== undefined && unit.trim()) {
      updateFields.Unit = unit.trim();
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'At least one field to update is required' });
    }

    const updatedFood = await Food.findOneAndUpdate(
      { FoodID: parseInt(foodId), UserID: parseInt(userId) },
      updateFields,
      { new: true }
    );
    
    return res.status(200).json({ 
      success: true,
      message: 'Food updated successfully',
      food: {
        foodId: updatedFood.FoodID,
        name: updatedFood.Name,
        caloriesPerUnit: updatedFood.CaloriesPerUnit,
        proteinPerUnit: updatedFood.ProteinPerUnit,
        carbsPerUnit: updatedFood.CarbsPerUnit,
        fatPerUnit: updatedFood.FatPerUnit,
        unit: updatedFood.Unit,
        upc: updatedFood.UPC
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error updating food' });
  }
};

// Delete a food
exports.deleteFood = async (req, res) => {
  const { userId, foodId } = req.params;

  try {
    const result = await Food.findOneAndDelete({ 
      FoodID: parseInt(foodId), 
      UserID: parseInt(userId) 
    });
    
    if (!result) {
      return res.status(404).json({ error: 'Food not found or does not belong to user' });
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Food deleted successfully'
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error deleting food' });
  }
};