// src/context/FoodContext.tsx
import React from "react";
import * as api from "../api/foodapi";

export type MealType = "Snack" | "Breakfast" | "Lunch" | "Dinner";

export type FoodItem = {
  id: string;
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
  unit: string;
};

type State = {
  dailyGoal: number;
  meals: Record<MealType, FoodItem[]>;
  selectedMeal: MealType | null;
  isSearchOpen: boolean;
  searchResults: FoodItem[];
  recentSearches: FoodItem[];
  totals: { protein: number; carbs: number; fats: number; calories: number };
  isLoading: boolean;
  currentDayId: number | null;
  setDailyGoal: (goal: number) => void;
  setSelectedMeal: (meal: MealType | null) => void;
  setSearchResults: (results: FoodItem[]) => void;
  openSearch: (meal: MealType) => void;
  closeSearch: () => void;
  addFoodToMeal: (meal: MealType, item: FoodItem) => void;
  removeFoodFromMeal: (meal: MealType, id: string) => void;
  searchFoods: (query: string) => Promise<void>;
  refreshMeals: () => Promise<void>;
};

const FoodContext = React.createContext<State | null>(null);

export function FoodProvider({ children }: { children: React.ReactNode }) {
  const [dailyGoal, setDailyGoalState] = React.useState<number>(2000);
  const [meals, setMeals] = React.useState<Record<MealType, FoodItem[]>>({
    Snack: [],
    Breakfast: [],
    Lunch: [],
    Dinner: [],
  });
  const [selectedMeal, setSelectedMeal] = React.useState<MealType | null>(null);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<FoodItem[]>([]);
  const [recentSearches, setRecentSearches] = React.useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentDayId, setCurrentDayId] = React.useState<number | null>(null);

  // Load user data on mount
  React.useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    setIsLoading(true);
    try {
      // Load user's daily goal
      const goals = await api.getUserGoals();
      setDailyGoalState(goals.calories);

      // Load today's meals
      await refreshMeals();
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshMeals() {
    try {
      // Get or create today's day
      const dayData = await api.getTodaysDay();
      
      if (!dayData) {
        console.error("Could not get today's day");
        return;
      }
      
      console.log('🔍 Raw entries from backend:', JSON.stringify(dayData.entries, null, 2));

      setCurrentDayId(dayData.dayId);
  
      // Get all foods to match entries with food details
      const allFoods = await api.getAllFoods();
      
      // Group entries by meal type
      const grouped: Record<MealType, FoodItem[]> = {
        Snack: [],
        Breakfast: [],
        Lunch: [],
        Dinner: [],
      };
  
      dayData.entries.forEach((entry: any) => {
        const mealType = entry.MealType as MealType;
        
        // Safety checks
        if (!entry.FoodID) {
          console.warn("Entry missing FoodID:", entry);
          return;
        }
        
        // Find the food details
        const food = allFoods.find(f => f.id === entry.FoodID.toString());
        
        if (food && grouped[mealType]) {
          // Add entry with MongoDB _id for deletion
          grouped[mealType].push({
            ...food,
            id: entry._id, // ✅ Use the full _id string from MongoDB
          });
        } else {
          console.warn(`Food not found for FoodID: ${entry.FoodID}`);
        }
      });
  
      console.log('📊 Grouped meals with IDs:', JSON.stringify(grouped, null, 2)); // ADD THIS

      setMeals(grouped);
    } catch (error) {
      console.error("Error refreshing meals:", error);
    }
  }

  const totals = React.useMemo(() => {
    let p = 0, c = 0, f = 0;
    
    (Object.keys(meals) as MealType[]).forEach((m) => {
      const mealItems = meals[m];
      if (mealItems && Array.isArray(mealItems) && mealItems.length > 0) {
        mealItems.forEach(i => { 
          p += Number(i.protein) || 0;
          c += Number(i.carbs) || 0;
          f += Number(i.fats) || 0;
        });
      }
    });
    
    p = Math.round(p * 100) / 100;
    c = Math.round(c * 100) / 100;
    f = Math.round(f * 100) / 100;
    
    const calories = Math.round(p * 4 + c * 4 + f * 9);
    
    return { protein: p, carbs: c, fats: f, calories };
  }, [meals]);

  function selectMeal(meal: MealType | null) {
    setSelectedMeal(meal);
  }

  function openSearch(meal: MealType) {
    setSelectedMeal(meal);
    setIsSearchOpen(true);
  }

  function closeSearch() {
    setIsSearchOpen(false);
    setSearchResults([]);
  }

  async function setDailyGoal(goal: number) {
    setDailyGoalState(goal);
    await api.updateUserGoal(goal);
  }

  async function addFoodToMeal(meal: MealType, item: FoodItem) {
    if (!currentDayId) {
      alert("Error: No day loaded. Please refresh the page.");
      return;
    }

    // Add to database
    const success = await api.addMealEntry(currentDayId, meal, item.id, 1);
    
    if (success) {
      // Refresh meals from database
      await refreshMeals();
      
      // Add to recent searches
      setRecentSearches(prev => {
        const filtered = prev.filter(f => f.id !== item.id);
        return [item, ...filtered].slice(0, 10);
      });
    } else {
      alert("Failed to add food. Please try again.");
    }
  }

  async function removeFoodFromMeal(_meal: MealType, entryId: string) {
    //debugging
    console.log('🗑️ Attempting to delete entryId:', entryId); // ADD THIS
    if (!currentDayId) {
      alert("Error: No day loaded. Please refresh the page.");
      return;
    }

    // Delete from database (entryId is the EntryID from backend)
    const success = await api.deleteMealEntry(currentDayId, entryId);
    
    if (success) {
      // Refresh meals from database
      await refreshMeals();
    } else {
      alert("Failed to remove food. Please try again.");
    }
  }

  async function searchFoods(query: string) {
    const results = await api.searchFoods(query);
    setSearchResults(results);
  }

  const value: State = {
    dailyGoal,
    meals,
    selectedMeal,
    isSearchOpen,
    searchResults,
    recentSearches,
    totals,
    isLoading,
    currentDayId,
    setDailyGoal,
    setSelectedMeal: selectMeal,
    setSearchResults,
    openSearch,
    closeSearch,
    addFoodToMeal,
    removeFoodFromMeal,
    searchFoods,
    refreshMeals,
  };

  return <FoodContext.Provider value={value}>{children}</FoodContext.Provider>;
}

export function useFood() {
  const ctx = React.useContext(FoodContext);
  if (!ctx) throw new Error("useFood must be used within FoodProvider");
  return ctx;
}

export function useFoodOptional() {
  return React.useContext(FoodContext);
}

export { FoodContext };
