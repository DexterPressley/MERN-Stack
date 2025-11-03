// src/context/FoodContext.tsx
import React from "react";

export type MealType = "Breakfast" | "Snack 1" | "Lunch" | "Snack 2" | "Dinner";

export type FoodItem = {
  id: string;
  name: string;
  protein: number; // g
  carbs: number;   // g
  fats: number;    // g
};

type State = {
  dailyGoal: number;
  meals: Record<MealType, FoodItem[]>;
  selectedMeal: MealType | null;
  isSearchOpen: boolean;
  totals: { protein: number; carbs: number; fats: number; calories: number };
  setDailyGoal: (goal: number) => void;
  setSelectedMeal: (meal: MealType | null) => void;
  openSearch: (meal: MealType) => void;
  closeSearch: () => void;
  addFoodToMeal: (meal: MealType, item: FoodItem) => void;
  removeFoodFromMeal: (meal: MealType, id: string) => void;
};

const FoodContext = React.createContext<State | null>(null);

const LS_KEY = "mern-fitness-day-v1";

function loadFromStorage(): { dailyGoal: number; meals: Record<MealType, FoodItem[]> } {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      return {
        dailyGoal: 2000,
        meals: { "Breakfast": [], "Snack 1": [], "Lunch": [], "Snack 2": [], "Dinner": [] },
      };
    }
    const parsed = JSON.parse(raw);
    // light validation
    const dg = typeof parsed.dailyGoal === "number" ? parsed.dailyGoal : 2000;
    const base: Record<MealType, FoodItem[]> = {
      "Breakfast": [], "Snack 1": [], "Lunch": [], "Snack 2": [], "Dinner": [],
    };
    const meals = { ...base, ...(parsed.meals ?? {}) } as Record<MealType, FoodItem[]>;
    return { dailyGoal: dg, meals };
  } catch {
    return {
      dailyGoal: 2000,
      meals: { "Breakfast": [], "Snack 1": [], "Lunch": [], "Snack 2": [], "Dinner": [] },
    };
  }
}

export function FoodProvider({ children }: { children: React.ReactNode }) {
  const initial = React.useMemo(loadFromStorage, []);
  const [dailyGoal, setDailyGoal] = React.useState<number>(initial.dailyGoal);
  const [meals, setMeals] = React.useState<Record<MealType, FoodItem[]>>(initial.meals);
  const [selectedMeal, setSelectedMeal] = React.useState<MealType | null>(null);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  // persist whenever dailyGoal or meals change
  React.useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ dailyGoal, meals }));
    } catch {}
  }, [dailyGoal, meals]);

  const totals = React.useMemo(() => {
    let p = 0, c = 0, f = 0;
    (Object.keys(meals) as MealType[]).forEach((m) =>
      meals[m].forEach(i => { p += i.protein; c += i.carbs; f += i.fats; })
    );
    const calories = p * 4 + c * 4 + f * 9;
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
  }

  function addFoodToMeal(meal: MealType, item: FoodItem) {
    setMeals(prev => ({ ...prev, [meal]: [item, ...(prev[meal] ?? [])] }));
  }

  function removeFoodFromMeal(meal: MealType, id: string) {
    setMeals(prev => ({ ...prev, [meal]: (prev[meal] ?? []).filter(f => f.id !== id) }));
  }

  const value: State = {
    dailyGoal,
    meals,
    selectedMeal,
    isSearchOpen,
    totals,
    setDailyGoal,
    setSelectedMeal: selectMeal,
    openSearch,
    closeSearch,
    addFoodToMeal,
    removeFoodFromMeal,
  };

  return <FoodContext.Provider value={value}>{children}</FoodContext.Provider>;
}

export function useFood() {
  const ctx = React.useContext(FoodContext);
  if (!ctx) throw new Error("useFood must be used within FoodProvider");
  return ctx;
}

// safe optional read (doesn't throw)
export { FoodContext };

export function useFoodOptional() {
  return React.useContext(FoodContext);
}