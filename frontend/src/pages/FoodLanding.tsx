// src/pages/FoodLanding.tsx

import React, { useEffect, useMemo, useState, useRef } from "react";
import type { FormEvent } from "react";
import { retrieveToken } from "../tokenStorage";

interface Entry {
  entryId: string;
  foodId: number;
  foodName: string;
  amount: number;
  mealType: string;
  caloriesPerUnit: number;
  proteinPerUnit: number;
  carbsPerUnit: number;
  fatPerUnit: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
}

interface Food {
  FoodID: number;
  Name: string;
  CaloriesPerUnit: number;
  ProteinPerUnit: number;
  CarbsPerUnit: number;
  FatPerUnit: number;
  Unit: string;
}

const APP_URL =
  (import.meta.env.VITE_APP_URL as string | undefined) ||
  "http://localhost:3001";

const API_BASE_URL = `${APP_URL.replace(/\/$/, "")}/api`;

function getAuth(): { token: string | null; userId: string | null } {
  const token = retrieveToken();

  const raw = localStorage.getItem("user_data");
  let userId: string | null = null;

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as {
        userId?: number | string;
        id?: number | string;
      };
      const idValue = parsed.userId ?? parsed.id;
      if (idValue !== undefined && idValue !== null) {
        userId = String(idValue);
      }
    } catch {
    }
  }

  return { token, userId };
}

function getUserName(): string {
  const raw = localStorage.getItem("user_data");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as {
        firstName?: string;
        lastName?: string;
      };
      const firstName = parsed.firstName || "";
      const lastName = parsed.lastName || "";
      return `${firstName} ${lastName}`.trim() || "User";
    } catch {
    }
  }
  return "User";
}

function formatDate(dateString?: string): string {
  if (!dateString) return new Date().toLocaleDateString('en-US');
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

// MacroProgressBar Component
const MacroProgressBar: React.FC<{
  label: string;
  current: number;
  goal: number;
  color: string;
}> = ({ label, current, goal, color }) => {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "0.5rem",
        fontSize: "0.9rem"
      }}>
        <span style={{ fontWeight: 600, color: "#2d5016" }}>{label}</span>
        <span style={{ color: "#6f4e37" }}>
          {Math.round(current)} / {goal}g
        </span>
      </div>
      <div style={{
        height: "24px",
        backgroundColor: "#e0d8b8",
        borderRadius: "12px",
        overflow: "hidden",
        position: "relative"
      }}>
        <div style={{
          height: "100%",
          width: `${percentage}%`,
          backgroundColor: color,
          transition: "width 0.3s ease",
          borderRadius: "12px"
        }} />
        <span style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: percentage > 50 ? "white" : "#2d5016"
        }}>
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

// MealSection Component
const MealSection: React.FC<{
  title: string;
  entries: Entry[];
  onDelete: (entryId: string) => void;
}> = ({ title, entries, onDelete }) => {
  const totalCals = entries.reduce((sum, e) => sum + (Number(e.calories) || 0), 0);

  return (
    <div style={{
      backgroundColor: "#f5f5dc",
      border: "2px solid #e0d8b8",
      borderRadius: "12px",
      padding: "1.25rem",
      marginBottom: "1rem"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
        paddingBottom: "0.75rem",
        borderBottom: "2px solid #e0d8b8"
      }}>
        <h3 style={{
          margin: 0,
          fontSize: "1.2rem",
          fontWeight: 700,
          color: "#2d5016"
        }}>
          {title}
        </h3>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <span style={{
            fontSize: "0.85rem",
            color: "#6f4e37",
            fontWeight: 500
          }}>
            {entries.length} {entries.length === 1 ? 'item' : 'items'}
          </span>
          <span style={{
            padding: "4px 12px",
            backgroundColor: "#2d5016",
            color: "white",
            borderRadius: "12px",
            fontSize: "0.9rem",
            fontWeight: 600
          }}>
            {totalCals} cal
          </span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "2rem",
          color: "#a0937d"
        }}>
          <p style={{
            margin: 0,
            fontSize: "0.9rem",
            fontStyle: "italic"
          }}>
            No foods added yet
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {entries.map((entry) => (
            <div key={entry.entryId} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem",
              backgroundColor: "white",
              borderRadius: "10px",
              border: "1px solid #e0d8b8",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 700,
                  color: "#2d5016",
                  marginBottom: "0.5rem",
                  fontSize: "1rem"
                }}>
                  {entry.foodName}
                </div>
                <div style={{
                  fontSize: "0.85rem",
                  color: "#6f4e37",
                  marginBottom: "0.25rem"
                }}>
                  {entry.amount} {entry.unit} • {entry.calories} cal • P: {entry.protein}g • C: {entry.carbs}g • F: {entry.fat}g
                </div>
                <div style={{
                  fontSize: "0.75rem",
                  color: "#a0937d",
                  fontStyle: "italic"
                }}>
                  Added {formatDate(entry.timestamp)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDelete(entry.entryId)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#e11d48",
                  color: "white",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FoodLanding: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [search, setSearch] = useState<string>("");
  
  // Food search states
  const [foodSearchQuery, setFoodSearchQuery] = useState<string>("");
  const [allFoods, setAllFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Manual entry fields
  const [name, setName] = useState<string>("");
  const [calories, setCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [fat, setFat] = useState<string>("");
  const [amount, setAmount] = useState<string>("1");
  const [unit, setUnit] = useState<string>("serving");
  const [mealType, setMealType] = useState<string>("Breakfast");
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [currentDayId, setCurrentDayId] = useState<number | null>(null);

  // For custom delete modal
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  // Goals - editable (stored in localStorage)
  const [calorieGoal, setCalorieGoal] = useState<number>(2000);
  const [proteinGoal, setProteinGoal] = useState<number>(150);
  const [carbsGoal, setCarbsGoal] = useState<number>(200);
  const [fatGoal, setFatGoal] = useState<number>(65);
  const [isEditingGoals, setIsEditingGoals] = useState<boolean>(false);

  // Temporary goals for editing
  const [tempCalorieGoal, setTempCalorieGoal] = useState<string>("2000");
  const [tempProteinGoal, setTempProteinGoal] = useState<string>("150");
  const [tempCarbsGoal, setTempCarbsGoal] = useState<string>("200");
  const [tempFatGoal, setTempFatGoal] = useState<string>("65");

  const userName = getUserName();

  // Load goals from localStorage on mount
  useEffect(() => {
    const savedGoals = localStorage.getItem('nutrition_goals');
    if (savedGoals) {
      try {
        const goals = JSON.parse(savedGoals);
        setCalorieGoal(goals.calories || 2000);
        setProteinGoal(goals.protein || 150);
        setCarbsGoal(goals.carbs || 200);
        setFatGoal(goals.fat || 65);
      } catch {
        // Use defaults if parsing fails
      }
    }
  }, []);

  // Save goals to localStorage whenever they change
  useEffect(() => {
    const goals = {
      calories: calorieGoal,
      protein: proteinGoal,
      carbs: carbsGoal,
      fat: fatGoal
    };
    localStorage.setItem('nutrition_goals', JSON.stringify(goals));
  }, [calorieGoal, proteinGoal, carbsGoal, fatGoal]);

  // Fetch all foods on mount
  useEffect(() => {
    async function fetchFoods() {
      const { token, userId } = getAuth();
      if (!token || !userId) return;

      try {
        const res = await fetch(`${API_BASE_URL}/users/${userId}/foods`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const body = await res.json();
          // API returns { success: true, results: [...], count: N }
          const foods = body.results || [];
          // Ensure foods is an array and filter out any invalid entries
          const validFoods = Array.isArray(foods) ? foods.filter(f => f && f.Name && f.FoodID) : [];
          console.log('Loaded foods:', validFoods.length);
          setAllFoods(validFoods);
        }
      } catch (err) {
        console.error("Error fetching foods:", err);
        setAllFoods([]);
      }
    }

    void fetchFoods();
  }, []);

  // Filter foods based on search query
  useEffect(() => {
    if (!foodSearchQuery.trim()) {
      setFilteredFoods([]);
      setShowDropdown(false);
      return;
    }

    const query = foodSearchQuery.toLowerCase();
    const matches = allFoods.filter(food => 
      food && food.Name && typeof food.Name === 'string' && food.Name.toLowerCase().includes(query)
    );
    
    console.log('Search query:', query);
    console.log('All foods count:', allFoods.length);
    console.log('Matches found:', matches.length);
    
    setFilteredFoods(matches);
    setShowDropdown(matches.length > 0);
  }, [foodSearchQuery, allFoods]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle food selection from dropdown
  function handleFoodSelect(food: Food) {
    setName(food.Name);
    setFoodSearchQuery(food.Name);
    setCalories(String(food.CaloriesPerUnit));
    setProtein(String(food.ProteinPerUnit));
    setCarbs(String(food.CarbsPerUnit));
    setFat(String(food.FatPerUnit));
    setUnit(food.Unit || "serving");
    setShowDropdown(false);
  }

  // Handle manual food name input
  function handleFoodNameChange(value: string) {
    setName(value);
    setFoodSearchQuery(value);
    
    // Clear nutrition fields if user is typing fresh
    if (!value.trim()) {
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
    }
  }

  // Open edit goals modal
  function openEditGoals(): void {
    setTempCalorieGoal(String(calorieGoal));
    setTempProteinGoal(String(proteinGoal));
    setTempCarbsGoal(String(carbsGoal));
    setTempFatGoal(String(fatGoal));
    setIsEditingGoals(true);
  }

  // Save edited goals
  function saveGoals(): void {
    const newCalories = Number(tempCalorieGoal) || 2000;
    const newProtein = Number(tempProteinGoal) || 150;
    const newCarbs = Number(tempCarbsGoal) || 200;
    const newFat = Number(tempFatGoal) || 65;

    setCalorieGoal(newCalories);
    setProteinGoal(newProtein);
    setCarbsGoal(newCarbs);
    setFatGoal(newFat);
    setIsEditingGoals(false);
  }

  // Cancel editing goals
  function cancelEditGoals(): void {
    setIsEditingGoals(false);
  }

  // Filter entries by search
  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const term = search.toLowerCase();
    return entries.filter(e => e.foodName.toLowerCase().includes(term));
  }, [entries, search]);

  // Group filtered entries by meal type
  const mealGroups = useMemo(() => {
    return {
      Breakfast: filteredEntries.filter(e => e.mealType === "Breakfast"),
      Lunch: filteredEntries.filter(e => e.mealType === "Lunch"),
      Dinner: filteredEntries.filter(e => e.mealType === "Dinner"),
      Snack: filteredEntries.filter(e => e.mealType === "Snack"),
    };
  }, [filteredEntries]);

  const totalCalories = useMemo<number>(
    () => entries.reduce((sum, e) => sum + (Number(e.calories) || 0), 0),
    [entries]
  );

  const totalProtein = useMemo<number>(
    () => entries.reduce((sum, e) => sum + (Number(e.protein) || 0), 0),
    [entries]
  );

  const totalCarbs = useMemo<number>(
    () => entries.reduce((sum, e) => sum + (Number(e.carbs) || 0), 0),
    [entries]
  );

  const totalFat = useMemo<number>(
    () => entries.reduce((sum, e) => sum + (Number(e.fat) || 0), 0),
    [entries]
  );

  // Get or create today's day
  async function getTodaysDay(): Promise<number | null> {
    const { token, userId } = getAuth();
    if (!token || !userId) return null;

    const today = new Date().toISOString().split('T')[0];

    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/days?startDate=${today}&endDate=${today}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const body = await res.json();
        if (body.results && body.results.length > 0) {
          return body.results[0].DayID;
        }
      }

      const createRes = await fetch(`${API_BASE_URL}/users/${userId}/days`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date: today }),
      });

      if (createRes.ok) {
        const createBody = await createRes.json();
        return createBody.day.dayId;
      }

      return null;
    } catch (err) {
      console.error("Error getting/creating today's day:", err);
      return null;
    }
  }

  // GET today's entries
  async function fetchEntries(): Promise<void> {
    const { token, userId } = getAuth();
    if (!token || !userId) {
      setError("Missing auth: userId or token not found (check localStorage).");
      return;
    }

    if (!currentDayId) return;

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/users/${userId}/days/${currentDayId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          (body as { message?: string; error?: string }).message ||
          (body as { message?: string; error?: string }).error ||
          `Failed to load entries (${res.status})`;
        throw new Error(msg);
      }

      const body = await res.json();
      const dayData = body.day;

      if (dayData && dayData.Entries) {
        const mapped: Entry[] = dayData.Entries.map((e: any) => ({
          entryId: e._id,
          foodId: e.FoodID,
          foodName: e.foodName || "Unknown",
          amount: e.Amount,
          mealType: e.MealType,
          caloriesPerUnit: e.caloriesPerUnit || 0,
          proteinPerUnit: e.proteinPerUnit || 0,
          carbsPerUnit: e.carbsPerUnit || 0,
          fatPerUnit: e.fatPerUnit || 0,
          unit: e.unit || "serving",
          calories: e.calories || 0,
          protein: e.protein || 0,
          carbs: e.carbs || 0,
          fat: e.fat || 0,
          timestamp: e.Timestamp,
        }));

        setEntries(mapped);
      } else {
        setEntries([]);
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong loading entries."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      const dayId = await getTodaysDay();
      if (dayId) {
        setCurrentDayId(dayId);
      }
    }
    void init();
  }, []);

  useEffect(() => {
    if (currentDayId) {
      void fetchEntries();
    }
  }, [currentDayId]);

  // Find existing food by name (case-insensitive)
  async function findExistingFood(foodName: string): Promise<Food | null> {
    const normalized = foodName.trim().toLowerCase();
    const existing = allFoods.find(f => f.Name.toLowerCase() === normalized);
    return existing || null;
  }

  // POST - Create food or use existing, then add entry
  async function handleAdd(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const { token, userId } = getAuth();
    if (!token || !userId) {
      setError("Missing auth: userId or token not found (check localStorage).");
      return;
    }
    if (!name.trim() || !currentDayId) return;

    try {
      setLoading(true);
      setError("");

      let foodId: number;

      // Check if food already exists
      const existingFood = await findExistingFood(name);

      if (existingFood) {
        // Use existing food
        foodId = existingFood.FoodID;
      } else {
        // Create new food
        const foodRes = await fetch(`${API_BASE_URL}/users/${userId}/foods`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            caloriesPerUnit: Number(calories) || 0,
            proteinPerUnit: Number(protein) || 0,
            carbsPerUnit: Number(carbs) || 0,
            fatPerUnit: Number(fat) || 0,
            unit: unit || "serving",
            upc: null,
          }),
        });

        if (!foodRes.ok) {
          const body = await foodRes.json().catch(() => ({}));
          const msg =
            (body as { message?: string; error?: string }).message ||
            (body as { message?: string; error?: string }).error ||
            `Failed to create food (${foodRes.status})`;
          throw new Error(msg);
        }

        const foodBody = await foodRes.json();
        foodId = foodBody.food?.foodId || foodBody.food?.FoodID;

        if (!foodId) {
          throw new Error("Failed to get food ID from response");
        }

        // Add to local cache
        const newFood: Food = {
          FoodID: foodId,
          Name: name.trim(),
          CaloriesPerUnit: Number(calories) || 0,
          ProteinPerUnit: Number(protein) || 0,
          CarbsPerUnit: Number(carbs) || 0,
          FatPerUnit: Number(fat) || 0,
          Unit: unit || "serving",
        };
        setAllFoods(prev => [...prev, newFood]);
      }

      // Create entry with specified amount
      const entryRes = await fetch(`${API_BASE_URL}/users/${userId}/days/${currentDayId}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          foodId: foodId,
          amount: Number(amount) || 1,
          mealType: mealType,
        }),
      });

      if (!entryRes.ok) {
        const body = await entryRes.json().catch(() => ({}));
        const msg =
          (body as { message?: string; error?: string }).message ||
          (body as { message?: string; error?: string }).error ||
          `Failed to add entry (${entryRes.status})`;
        throw new Error(msg);
      }

      await fetchEntries();

      // Reset form
      setName("");
      setFoodSearchQuery("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setAmount("1");
      setUnit("serving");
      setMealType("Breakfast");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong adding entry."
      );
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete(entryId: string): void {
    setEntryToDelete(entryId);
    setShowDeleteModal(true);
  }

  async function handleDelete(): Promise<void> {
    if (!entryToDelete || !currentDayId) return;

    const { token, userId } = getAuth();
    if (!token || !userId) {
      setError("Missing auth: userId or token not found (check localStorage).");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE_URL}/users/${userId}/days/${currentDayId}/entries/${entryToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok && res.status !== 200) {
        const body = await res.json().catch(() => ({}));
        const msg =
          (body as { message?: string; error?: string }).message ||
          (body as { message?: string; error?: string }).error ||
          `Failed to delete entry (${res.status})`;
        throw new Error(msg);
      }

      setEntries((prev) => prev.filter((e) => e.entryId !== entryToDelete));
      setShowDeleteModal(false);
      setEntryToDelete(null);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong deleting entry."
      );
    } finally {
      setLoading(false);
    }
  }

  function cancelDelete(): void {
    setShowDeleteModal(false);
    setEntryToDelete(null);
  }

  function handleLogout(): void {
    localStorage.removeItem('user_data');
    localStorage.removeItem('token_data');
    window.location.href = '/';
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#faf8f3",
      padding: "2rem"
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        <header style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          padding: "1.5rem",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}>
          <div>
            <h1 style={{
              fontSize: "2rem",
              fontWeight: 700,
              margin: 0,
              color: "#2d5016"
            }}>
              Welcome back, {userName}! 👋
            </h1>
            <p style={{
              color: "#6f4e37",
              marginTop: "0.5rem",
              fontSize: "1rem",
              margin: "0.5rem 0 0 0"
            }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "2px solid #2d5016",
              backgroundColor: "white",
              color: "#2d5016",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </header>

        <div style={{
          marginBottom: "2rem",
          padding: "1.5rem",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}>
          <label htmlFor="search-foods" style={{
            display: "block",
            marginBottom: "0.75rem",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#2d5016"
          }}>
            🔍 Search Your Foods
          </label>
          <input
            id="search-foods"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to filter foods by name..."
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "2px solid #e0d8b8",
              borderRadius: "8px",
              fontSize: "1rem"
            }}
          />
          {search && (
            <p style={{
              marginTop: "0.5rem",
              fontSize: "0.9rem",
              color: "#6f4e37"
            }}>
              Showing {filteredEntries.length} of {entries.length} foods
            </p>
          )}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 450px",
          gap: "2rem"
        }}>
          <main>
            <h2 style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "1.5rem",
              color: "#2d5016"
            }}>
              Today's Meals
            </h2>

            <MealSection
              title="🌅 Breakfast"
              entries={mealGroups.Breakfast}
              onDelete={confirmDelete}
            />
            <MealSection
              title="🌞 Lunch"
              entries={mealGroups.Lunch}
              onDelete={confirmDelete}
            />
            <MealSection
              title="🌙 Dinner"
              entries={mealGroups.Dinner}
              onDelete={confirmDelete}
            />
            <MealSection
              title="🎁 Snacks"
              entries={mealGroups.Snack}
              onDelete={confirmDelete}
            />
          </main>

          <aside>
            <div style={{
              backgroundColor: "white",
              border: "2px solid #e0d8b8",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "2rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem"
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "#2d5016"
                }}>
                  📊 Daily Progress
                </h3>
                <button
                  type="button"
                  onClick={openEditGoals}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "2px solid #2d5016",
                    backgroundColor: "white",
                    color: "#2d5016",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  ⚙️ Edit Goals
                </button>
              </div>

              <div style={{
                marginBottom: "1.5rem",
                padding: "1.5rem",
                backgroundColor: "#f5f5dc",
                borderRadius: "12px",
                textAlign: "center"
              }}>
                <div style={{
                  fontSize: "3rem",
                  fontWeight: 700,
                  color: "#2d5016",
                  lineHeight: 1
                }}>
                  {totalCalories}
                </div>
                <div style={{
                  fontSize: "1rem",
                  color: "#6f4e37",
                  marginTop: "0.25rem"
                }}>
                  of {calorieGoal} calories
                </div>
                <div style={{
                  marginTop: "0.75rem",
                  padding: "4px 12px",
                  backgroundColor: totalCalories > calorieGoal ? "#e11d48" : "#16a34a",
                  color: "white",
                  borderRadius: "12px",
                  display: "inline-block",
                  fontSize: "0.85rem",
                  fontWeight: 600
                }}>
                  {totalCalories > calorieGoal ? `+${totalCalories - calorieGoal} over` : `${calorieGoal - totalCalories} remaining`}
                </div>
              </div>

              <MacroProgressBar
                label="Protein"
                current={totalProtein}
                goal={proteinGoal}
                color="#ef4444"
              />
              <MacroProgressBar
                label="Carbs"
                current={totalCarbs}
                goal={carbsGoal}
                color="#3b82f6"
              />
              <MacroProgressBar
                label="Fat"
                current={totalFat}
                goal={fatGoal}
                color="#f59e0b"
              />
            </div>

            <div style={{
              backgroundColor: "white",
              border: "2px solid #e0d8b8",
              borderRadius: "12px",
              padding: "1.5rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}>
              <h3 style={{
                margin: 0,
                marginBottom: "1rem",
                fontSize: "1.3rem",
                fontWeight: 700,
                color: "#2d5016"
              }}>
                ➕ Add Food
              </h3>

              {error && (
                <div style={{
                  padding: "0.75rem",
                  backgroundColor: "#fee2e2",
                  border: "2px solid #fecaca",
                  borderRadius: "8px",
                  color: "#991b1b",
                  fontSize: "0.9rem",
                  marginBottom: "1rem"
                }}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleAdd}>
                <div style={{ marginBottom: "1rem", position: "relative" }} ref={dropdownRef}>
                  <label htmlFor="food-name" style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#2d5016"
                  }}>
                    Food Name *
                  </label>
                  <input
                    id="food-name"
                    type="text"
                    value={name}
                    onChange={(e) => handleFoodNameChange(e.target.value)}
                    onFocus={() => {
                      if (foodSearchQuery.trim() && filteredFoods.length > 0) {
                        setShowDropdown(true);
                      }
                    }}
                    placeholder="Type to search foods..."
                    required
                    autoComplete="off"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "2px solid #e0d8b8",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      boxSizing: "border-box"
                    }}
                  />
                  
                  {/* Dropdown for food search results */}
                  {showDropdown && filteredFoods.length > 0 && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      backgroundColor: "white",
                      border: "2px solid #e0d8b8",
                      borderTop: "none",
                      borderRadius: "0 0 8px 8px",
                      maxHeight: "200px",
                      overflowY: "auto",
                      zIndex: 1000,
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                    }}>
                      {filteredFoods.filter(food => food && food.Name).map((food) => (
                        <div
                          key={food.FoodID}
                          onClick={() => handleFoodSelect(food)}
                          style={{
                            padding: "10px 12px",
                            cursor: "pointer",
                            borderBottom: "1px solid #f5f5dc",
                            transition: "background-color 0.15s"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f5f5dc";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "white";
                          }}
                        >
                          <div style={{
                            fontWeight: 600,
                            color: "#2d5016",
                            marginBottom: "2px"
                          }}>
                            {food.Name || "Unknown Food"}
                          </div>
                          <div style={{
                            fontSize: "0.8rem",
                            color: "#6f4e37"
                          }}>
                            {food.CaloriesPerUnit || 0} cal • P: {food.ProteinPerUnit || 0}g • C: {food.CarbsPerUnit || 0}g • F: {food.FatPerUnit || 0}g per {food.Unit || "serving"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  marginBottom: "1rem"
                }}>
                  <div>
                    <label htmlFor="amount" style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "#2d5016"
                    }}>
                      Amount
                    </label>
                    <input
                      id="amount"
                      type="number"
                      min={0}
                      step="0.1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="1"
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "2px solid #e0d8b8",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="unit" style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "#2d5016"
                    }}>
                      Unit
                    </label>
                    <input
                      id="unit"
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="serving"
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "2px solid #e0d8b8",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  marginBottom: "1rem"
                }}>
                  <div>
                    <label htmlFor="calories" style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "#2d5016"
                    }}>
                      Calories
                    </label>
                    <input
                      id="calories"
                      type="number"
                      min={0}
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      placeholder="300"
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "2px solid #e0d8b8",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="protein" style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "#2d5016"
                    }}>
                      Protein (g)
                    </label>
                    <input
                      id="protein"
                      type="number"
                      min={0}
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      placeholder="30"
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "2px solid #e0d8b8",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="carbs" style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "#2d5016"
                    }}>
                      Carbs (g)
                    </label>
                    <input
                      id="carbs"
                      type="number"
                      min={0}
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      placeholder="0"
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "2px solid #e0d8b8",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="fat" style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "#2d5016"
                    }}>
                      Fat (g)
                    </label>
                    <input
                      id="fat"
                      type="number"
                      min={0}
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      placeholder="5"
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "2px solid #e0d8b8",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label htmlFor="meal-type" style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#2d5016"
                  }}>
                    Meal Type
                  </label>
                  <select
                    id="meal-type"
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "2px solid #e0d8b8",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      backgroundColor: "white",
                      cursor: "pointer",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="Breakfast">🌅 Breakfast</option>
                    <option value="Lunch">🌞 Lunch</option>
                    <option value="Dinner">🌙 Dinner</option>
                    <option value="Snack">🎁 Snack</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!name.trim() || loading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: !name.trim() || loading ? "#ccc" : "#2d5016",
                    color: "white",
                    fontSize: "1rem",
                    fontWeight: 700,
                    cursor: !name.trim() || loading ? "not-allowed" : "pointer",
                    opacity: !name.trim() || loading ? 0.6 : 1
                  }}
                >
                  {loading ? "Adding..." : "Add Food Entry"}
                </button>
              </form>
            </div>
          </aside>
        </div>

        {/* Delete Modal */}
        {showDeleteModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "450px",
              width: "90%",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
              border: "2px solid #e0d8b8"
            }}>
              <h3 style={{
                marginTop: 0,
                marginBottom: "1rem",
                color: "#e11d48",
                fontSize: "1.3rem",
                fontWeight: 700
              }}>
                ⚠️ Delete Food Entry?
              </h3>
              <p style={{
                marginBottom: "1.5rem",
                color: "#6f4e37",
                fontSize: "1rem",
                lineHeight: 1.5
              }}>
                Are you sure you want to delete this food entry? This action cannot be undone.
              </p>
              <div style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end"
              }}>
                <button
                  type="button"
                  onClick={cancelDelete}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "2px solid #e0d8b8",
                    backgroundColor: "white",
                    color: "#2d5016",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: loading ? "#ccc" : "#e11d48",
                    color: "white",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Goals Modal */}
        {isEditingGoals && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
              border: "2px solid #e0d8b8"
            }}>
              <h3 style={{
                marginTop: 0,
                marginBottom: "1.5rem",
                color: "#2d5016",
                fontSize: "1.5rem",
                fontWeight: 700
              }}>
                ⚙️ Edit Your Daily Goals
              </h3>

              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="edit-calorie-goal" style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "#2d5016"
                }}>
                  Calorie Goal
                </label>
                <input
                  id="edit-calorie-goal"
                  type="number"
                  min={0}
                  value={tempCalorieGoal}
                  onChange={(e) => setTempCalorieGoal(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e0d8b8",
                    borderRadius: "8px",
                    fontSize: "1rem"
                  }}
                />
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "1rem",
                marginBottom: "1.5rem"
              }}>
                <div>
                  <label htmlFor="edit-protein-goal" style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#2d5016"
                  }}>
                    Protein (g)
                  </label>
                  <input
                    id="edit-protein-goal"
                    type="number"
                    min={0}
                    value={tempProteinGoal}
                    onChange={(e) => setTempProteinGoal(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "2px solid #e0d8b8",
                      borderRadius: "8px",
                      fontSize: "1rem"
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="edit-carbs-goal" style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#2d5016"
                  }}>
                    Carbs (g)
                  </label>
                  <input
                    id="edit-carbs-goal"
                    type="number"
                    min={0}
                    value={tempCarbsGoal}
                    onChange={(e) => setTempCarbsGoal(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "2px solid #e0d8b8",
                      borderRadius: "8px",
                      fontSize: "1rem"
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="edit-fat-goal" style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#2d5016"
                  }}>
                    Fat (g)
                  </label>
                  <input
                    id="edit-fat-goal"
                    type="number"
                    min={0}
                    value={tempFatGoal}
                    onChange={(e) => setTempFatGoal(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "2px solid #e0d8b8",
                      borderRadius: "8px",
                      fontSize: "1rem"
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end"
              }}>
                <button
                  type="button"
                  onClick={cancelEditGoals}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "8px",
                    border: "2px solid #e0d8b8",
                    backgroundColor: "white",
                    color: "#2d5016",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveGoals}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#2d5016",
                    color: "white",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Save Goals
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodLanding;