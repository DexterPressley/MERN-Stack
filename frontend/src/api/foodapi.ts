// frontend/src/api/foodApi.ts

const API_BASE = 'http://localhost:3001/api';

export interface FoodItem {
  id: string;
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
  unit: string;
}

export interface DayData {
  dayId: number;
  date: string;
  entries: Entry[];
}

export interface Entry {
  EntryID: number;
  FoodID: number;
  Quantity: number;
  MealType: string;
}

// Get JWT token from localStorage
function getAuthToken(): string {
  return localStorage.getItem('token_data') || '';
}

// Get userId from localStorage
function getUserId(): string {
  try {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      return user.userId?.toString() || user.id?.toString() || '';
    }
  } catch (e) {
    console.error('Error getting userId:', e);
  }
  return '';
}

// Search foods for logged-in user
export async function searchFoods(query: string): Promise<FoodItem[]> {
  try {
    const userId = getUserId();
    const token = getAuthToken();
    
    if (!userId || !token) {
      console.error('Missing userId or token');
      return [];
    }
    
    const response = await fetch(`${API_BASE}/users/${userId}/foods?search=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    return (data.results || []).map((food: any) => ({
      id: food.FoodID?.toString(),
      name: food.Name,
      protein: food.ProteinPerUnit || 0,
      carbs: food.CarbsPerUnit || 0,
      fats: food.FatPerUnit || 0,
      calories: food.CaloriesPerUnit || 0,
      unit: food.Unit || '',
    }));
  } catch (error) {
    console.error('Error searching foods:', error);
    return [];
  }
}

// Get all foods for logged-in user
export async function getAllFoods(): Promise<FoodItem[]> {
  try {
    const userId = getUserId();
    const token = getAuthToken();
    
    if (!userId || !token) {
      console.error('Missing userId or token');
      return [];
    }
    
    const response = await fetch(`${API_BASE}/users/${userId}/foods`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    return (data.results || []).map((food: any) => ({
      id: food.FoodID?.toString(),
      name: food.Name,
      protein: food.ProteinPerUnit || 0,
      carbs: food.CarbsPerUnit || 0,
      fats: food.FatPerUnit || 0,
      calories: food.CaloriesPerUnit || 0,
      unit: food.Unit || '',
    }));
  } catch (error) {
    console.error('Error fetching foods:', error);
    return [];
  }
}

// Get or create today's Day document
export async function getTodaysDay(): Promise<DayData | null> {
  try {
    const userId = getUserId();
    const token = getAuthToken();
    const today = new Date().toISOString().split('T')[0];
    
    if (!userId || !token) {
      console.error('Missing userId or token');
      return null;
    }
    
    // Try to get today's day
    const response = await fetch(`${API_BASE}/users/${userId}/days?startDate=${today}&endDate=${today}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const day = data.results[0];
      return {
        dayId: day.DayID,
        date: day.Date,
        entries: day.Entries || [],
      };
    }
    
    // Create new day if doesn't exist
    const createResponse = await fetch(`${API_BASE}/users/${userId}/days`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date: today }),
    });
    
    const createData = await createResponse.json();
    
    if (createData.success) {
      return {
        dayId: createData.day.dayId,
        date: createData.day.date,
        entries: [],
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching/creating day:', error);
    return null;
  }
}

// Add entry to a meal
export async function addMealEntry(
  dayId: number,
  mealType: string,
  foodId: string,
  quantity: number = 1
): Promise<boolean> {
  try {
    const userId = getUserId();
    const token = getAuthToken();
    
    if (!userId || !token) {
      console.error('Missing userId or token');
      return false;
    }
    
    const response = await fetch(`${API_BASE}/users/${userId}/days/${dayId}/entries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        foodId: parseInt(foodId),
        amount: quantity,  // ✅ Correct - backend expects "amount"
        mealType,
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error adding entry:', error);
    return false;
  }
}

// Delete a meal entry
export async function deleteMealEntry(
  dayId: number,
  entryId: string
): Promise<boolean> {
  try {
    const userId = getUserId();
    const token = getAuthToken();
    
    if (!userId || !token) {
      console.error('Missing userId or token');
      return false;
    }
    
    const response = await fetch(`${API_BASE}/users/${userId}/days/${dayId}/entries/${entryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error deleting entry:', error);
    return false;
  }
}

// Get user's goals
export async function getUserGoals(): Promise<{ calories: number; protein: number; carbs: number; fat: number }> {
  try {
    const userId = getUserId();
    const token = getAuthToken();
    
    if (!userId || !token) {
      return { calories: 2000, protein: 100, carbs: 100, fat: 100 };
    }
    
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    return {
      calories: data.user?.CalorieGoal || 2000,
      protein: data.user?.ProteinGoal || 100,
      carbs: data.user?.CarbsGoal || 100,
      fat: data.user?.FatGoal || 100,
    };
  } catch (error) {
    console.error('Error fetching user goals:', error);
    return { calories: 2000, protein: 100, carbs: 100, fat: 100 };
  }
}

// Update user's calorie goal
export async function updateUserGoal(calorieGoal: number): Promise<boolean> {
    try {
      const userId = getUserId();
      const token = getAuthToken();
      
      if (!userId || !token) {
        return false;
      }
      
      const response = await fetch(`${API_BASE}/users/${userId}/calorie-goal`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ calorieGoal: calorieGoal }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error updating user goal:', error);
      return false;
    }
  }