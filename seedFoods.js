// seedFoods.js
require('dotenv').config();
const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  FoodID: Number,
  UserID: Number,
  Name: String,
  CaloriesPerUnit: Number,
  ProteinPerUnit: Number,
  CarbsPerUnit: Number,
  FatPerUnit: Number,
  Unit: String,
  UPC: { type: String, default: null },
  CreatedAt: { type: Date, default: Date.now }
});

const Food = mongoose.model('Food', foodSchema, 'Foods');

const foods = [
  {
    Name: "Egg",
    CaloriesPerUnit: 73.9,
    ProteinPerUnit: 6.24,
    CarbsPerUnit: 0.101,
    FatPerUnit: 4.35,
    Unit: "egg(s)"
  },
  {
    Name: "Oatmeal, milk",
    CaloriesPerUnit: 129,
    ProteinPerUnit: 4.81,
    CarbsPerUnit: 16.52,
    FatPerUnit: 5.4,
    Unit: "100 grams"
  },
  {
    Name: "Turkey sandwich, wheat",
    CaloriesPerUnit: 187,
    ProteinPerUnit: 13.05,
    CarbsPerUnit: 24.56,
    FatPerUnit: 3.88,
    Unit: "100 grams"
  },
  {
    Name: "Caesar salad, no dressing",
    CaloriesPerUnit: 77,
    ProteinPerUnit: 4,
    CarbsPerUnit: 7.49,
    FatPerUnit: 3.41,
    Unit: "100 grams"
  },
  {
    Name: "Cheeseburger (McDonald's)",
    CaloriesPerUnit: 297,
    ProteinPerUnit: 14.8,
    CarbsPerUnit: 28,
    FatPerUnit: 14.2,
    Unit: "burger(s)"
  },
  {
    Name: "Cheese pizza",
    CaloriesPerUnit: 289,
    ProteinPerUnit: 12.6,
    CarbsPerUnit: 35.1,
    FatPerUnit: 10.9,
    Unit: "14in slice(s)"
  },
  {
    Name: "Chicken breast, boneless, skinless",
    CaloriesPerUnit: 112,
    ProteinPerUnit: 22.5,
    CarbsPerUnit: 0,
    FatPerUnit: 1.93,
    Unit: "100 grams"
  },
  {
    Name: "Chicken thigh, skin-on",
    CaloriesPerUnit: 193,
    ProteinPerUnit: 17.1,
    CarbsPerUnit: 0,
    FatPerUnit: 13.4,
    Unit: "100 grams"
  },
  {
    Name: "Potato chips, salted",
    CaloriesPerUnit: 532,
    ProteinPerUnit: 6.39,
    CarbsPerUnit: 53.8,
    FatPerUnit: 34,
    Unit: "100 grams"
  },
  {
    Name: "Banana",
    CaloriesPerUnit: 84.7,
    ProteinPerUnit: 0.803,
    CarbsPerUnit: 19.8,
    FatPerUnit: 0.242,
    Unit: "banana(s)"
  },
  {
    Name: "Cola",
    CaloriesPerUnit: 13,
    ProteinPerUnit: 0,
    CarbsPerUnit: 3.21,
    FatPerUnit: 0.077,
    Unit: "fl oz"
  }
];

async function seedFoods() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'COP4331Cards' });
    console.log('✅ Connected to MongoDB');

    // Get the next FoodID
    const lastFood = await Food.findOne().sort({ FoodID: -1 }).lean();
    let nextFoodId = lastFood ? lastFood.FoodID + 1 : 1;

    // Insert all foods for user 42
    for (const food of foods) {
      const newFood = new Food({
        FoodID: nextFoodId++,
        UserID: 42, // Your user ID
        ...food,
        UPC: null,
        CreatedAt: new Date()
      });
      await newFood.save();
      console.log(`✅ Added: ${food.Name}`);
    }

    console.log('🎉 All foods added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedFoods();
