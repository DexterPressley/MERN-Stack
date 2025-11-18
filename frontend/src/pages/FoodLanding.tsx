// src/pages/FoodLanding.tsx

import React, { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { retrieveToken } from "../tokenStorage";

interface Food {
  foodId: number;
  name: string;
  caloriesPerUnit: number;
  proteinPerUnit: number;
  carbsPerUnit: number;
  fatPerUnit: number;
  unit: string;
  upc?: string | null;
  createdAt?: string;
}

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

const APP_URL =
  (import.meta.env.VITE_APP_URL as string | undefined) ||
  "http://localhost:5000";

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
  return date.toLocaleDateString('en-US');
}

const FoodLanding: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState<string>("");
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [mealType, setMealType] = useState<string>("Breakfast");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [currentDayId, setCurrentDayId] = useState<number | null>(null);

  // For custom delete modal
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const userName = getUserName();

  const filteredEntries = useMemo<Entry[]>(() => {
    const term = search.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter((e) => e.foodName.toLowerCase().includes(term));
  }, [entries, search]);

  const totalCalories = useMemo<number>(
    () =>
      filteredEntries.reduce(
        (sum, e) => sum + (Number(e.calories) || 0),
        0
      ),
    [filteredEntries]
  );

  const totalProtein = useMemo<number>(
    () =>
      filteredEntries.reduce(
        (sum, e) => sum + (Number(e.protein) || 0),
        0
      ),
    [filteredEntries]
  );

  const totalCarbs = useMemo<number>(
    () =>
      filteredEntries.reduce(
        (sum, e) => sum + (Number(e.carbs) || 0),
        0
      ),
    [filteredEntries]
  );

  const totalFat = useMemo<number>(
    () =>
      filteredEntries.reduce(
        (sum, e) => sum + (Number(e.fat) || 0),
        0
      ),
    [filteredEntries]
  );

  // Get or create today's day
  async function getTodaysDay(): Promise<number | null> {
    const { token, userId } = getAuth();
    if (!token || !userId) return null;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    try {
      // Try to get today's day
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

      // If no day exists for today, create it
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

  // GET /api/users/:userId/foods (for the dropdown)
  async function fetchFoods(): Promise<void> {
    const { token, userId } = getAuth();
    if (!token || !userId) {
      setError("Missing auth: userId or token not found (check localStorage).");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/foods`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load foods");
      }

      const body = await res.json();
      const results = body.results ?? [];

      const mapped: Food[] = results.map((f: any) => ({
        foodId: f.FoodID,
        name: f.Name,
        caloriesPerUnit: f.CaloriesPerUnit,
        proteinPerUnit: f.ProteinPerUnit,
        carbsPerUnit: f.CarbsPerUnit,
        fatPerUnit: f.FatPerUnit,
        unit: f.Unit,
        upc: f.UPC ?? null,
        createdAt: f.CreatedAt ?? undefined,
      }));

      setFoods(mapped);
    } catch (err) {
      console.error(err);
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
      await fetchFoods(); // Load food library for dropdown
    }
    void init();
  }, []);

  useEffect(() => {
    if (currentDayId) {
      void fetchEntries();
    }
  }, [currentDayId]);

  // POST /api/users/:userId/days/:dayId/entries
  async function handleAdd(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const { token, userId } = getAuth();
    if (!token || !userId) {
      setError("Missing auth: userId or token not found (check localStorage).");
      return;
    }
    if (!selectedFoodId || !amount.trim() || !currentDayId) return;

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/users/${userId}/days/${currentDayId}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          foodId: Number(selectedFoodId),
          amount: Number(amount),
          mealType: mealType,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.log("Add entry error response:", body);
        const msg =
          (body as { message?: string; error?: string }).message ||
          (body as { message?: string; error?: string }).error ||
          `Failed to add entry (${res.status})`;
        throw new Error(msg);
      }

      await fetchEntries();

      setSelectedFoodId("");
      setAmount("");
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

  // Show confirmation modal
  function confirmDelete(entryId: string): void {
    setEntryToDelete(entryId);
    setShowDeleteModal(true);
  }

  // DELETE /api/users/:userId/days/:dayId/entries/:entryId
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

  // Cancel deletion
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
    <div className="content-box" style={{ maxWidth: "1000px" }}>
      <div id="foodLandingDiv">
        {/* Header with welcome and logout */}
        <div className="header-row" style={{ marginBottom: "1.5rem" }}>
          <span id="inner-title">Welcome, {userName}!</span>
          <button
            type="button"
            className="btn btn-back"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {/* Title and Totals */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 700, margin: 0, color: "var(--text)" }}>
            Daily Food Tracker
          </h1>
          <p style={{ color: "var(--muted)", marginTop: "0.3rem", marginBottom: "0.5rem" }}>
            Track what you eat today
          </p>
          
          {/* Totals Row */}
          <div style={{
            display: "flex",
            gap: "2rem",
            marginTop: "1rem",
            flexWrap: "wrap"
          }}>
            <div style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--brand)"
            }}>
              <span style={{ fontSize: "0.9rem", color: "var(--muted)", display: "block" }}>Total Calories</span>
              {totalCalories} kcal
            </div>

            <div style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--brand)"
            }}>
              <span style={{ fontSize: "0.9rem", color: "var(--muted)", display: "block" }}>Total Protein</span>
              {totalProtein} g
            </div>

            <div style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--brand)"
            }}>
              <span style={{ fontSize: "0.9rem", color: "var(--muted)", display: "block" }}>Total Carbs</span>
              {totalCarbs} g
            </div>

            <div style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--brand)"
            }}>
              <span style={{ fontSize: "0.9rem", color: "var(--muted)", display: "block" }}>Total Fat</span>
              {totalFat} g
            </div>
          </div>
        </div>

        {/* Horizontal Divider */}
        <div style={{
          height: "1px",
          backgroundColor: "#6f4e37",
          margin: "1.5rem 0"
        }}></div>

        {/* Search and Add Entry - Side by Side */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: "1.5rem",
          marginBottom: "1.5rem",
          alignItems: "start"
        }}>
          {/* Search Section */}
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text)" }}>
              Search Entries
            </h2>
            <label htmlFor="entry-search" style={{ fontWeight: 600, color: "var(--muted)", fontSize: "0.9rem" }}>
              Food Name
            </label>
            <input
              id="entry-search"
              type="text"
              placeholder="e.g. chicken, rice, apple..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                marginTop: "0.3rem",
                marginBottom: "0.8rem",
                padding: "8px 10px",
                border: "2px solid #6f4e37",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
            <p style={{ marginTop: "0.4rem", fontSize: "0.85rem", color: "var(--muted)" }}>
              Filter your entries by food name
            </p>
          </div>

          {/* Vertical Divider */}
          <div style={{
            width: "1px",
            backgroundColor: "#6f4e37",
            alignSelf: "stretch",
            marginTop: "2.5rem",
            marginBottom: "0.5rem"
          }}></div>

          {/* Add Entry Form */}
          <form onSubmit={handleAdd}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text)" }}>
              Add Food Entry
            </h2>

            <label htmlFor="food-select" style={{ fontWeight: 600, color: "var(--muted)", fontSize: "0.9rem" }}>
              Select Food
            </label>
            <select
              id="food-select"
              value={selectedFoodId}
              onChange={(e) => setSelectedFoodId(e.target.value)}
              style={{
                width: "100%",
                marginTop: "0.3rem",
                marginBottom: "0.8rem",
                padding: "8px 10px",
                border: "2px solid #6f4e37",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "white",
              }}
            >
              <option value="">-- Select a food --</option>
              {foods.map((food) => (
                <option key={food.foodId} value={food.foodId}>
                  {food.name} ({food.caloriesPerUnit} cal per {food.unit})
                </option>
              ))}
            </select>

            <label htmlFor="entry-amount" style={{ fontWeight: 600, color: "var(--muted)", fontSize: "0.9rem" }}>
              Amount
            </label>
            <input
              id="entry-amount"
              type="number"
              min={0}
              step="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1.5"
              style={{
                width: "100%",
                marginTop: "0.3rem",
                marginBottom: "0.8rem",
                padding: "8px 10px",
                border: "2px solid #6f4e37",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />

            <label htmlFor="meal-type" style={{ fontWeight: 600, color: "var(--muted)", fontSize: "0.9rem" }}>
              Meal Type
            </label>
            <select
              id="meal-type"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              style={{
                width: "100%",
                marginTop: "0.3rem",
                marginBottom: "0.8rem",
                padding: "8px 10px",
                border: "2px solid #6f4e37",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "white",
              }}
            >
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snack">Snack</option>
            </select>

            <button
              type="submit"
              disabled={!selectedFoodId || !amount.trim()}
              className="buttons"
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: (!selectedFoodId || !amount.trim()) ? "#ccc" : "#2d5016",
                cursor: (!selectedFoodId || !amount.trim()) ? "not-allowed" : "pointer",
                opacity: (!selectedFoodId || !amount.trim()) ? 0.6 : 1,
                fontSize: "14px",
              }}
            >
              Add Entry
            </button>
          </form>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="error" style={{ marginBottom: "1rem", display: "block" }}>
            {error}
          </div>
        )}
        {loading && (
          <div style={{ marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--muted)" }}>
            Loading…
          </div>
        )}

        {/* Horizontal Divider */}
        <div style={{
          height: "1px",
          backgroundColor: "#6f4e37",
          margin: "1.5rem 0"
        }}></div>

        {/* Entries Table */}
        <section>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.8rem", color: "var(--text)" }}>
            Today's Entries ({filteredEntries.length})
          </h2>

          {filteredEntries.length === 0 ? (
            <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
              No entries yet. Add your first entry above.
            </p>
          ) : (
            <div style={{
              border: "1px solid var(--border)",
              borderRadius: "10px",
              overflow: "hidden"
            }}>
              <div style={{ overflowX: "auto" }}>
                <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "12px" }}>Food</th>
                      <th style={{ textAlign: "center", padding: "12px" }}>Amount</th>
                      <th style={{ textAlign: "center", padding: "12px" }}>Meal</th>
                      <th style={{ textAlign: "center", padding: "12px" }}>Calories</th>
                      <th style={{ textAlign: "center", padding: "12px" }}>Protein (g)</th>
                      <th style={{ textAlign: "center", padding: "12px" }}>Carbs (g)</th>
                      <th style={{ textAlign: "center", padding: "12px" }}>Fat (g)</th>
                      <th style={{ textAlign: "center", padding: "12px" }}>Time</th>
                      <th style={{ textAlign: "center", padding: "12px", width: "100px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => (
                      <tr key={entry.entryId}>
                        <td style={{ padding: "12px", fontWeight: 500 }}>{entry.foodName}</td>
                        <td style={{ padding: "12px", textAlign: "center" }}>{entry.amount} {entry.unit}</td>
                        <td style={{ padding: "12px", textAlign: "center", fontSize: "0.85rem" }}>{entry.mealType}</td>
                        <td style={{ padding: "12px", textAlign: "center" }}>{entry.calories}</td>
                        <td style={{ padding: "12px", textAlign: "center", color: "var(--muted)" }}>{entry.protein}</td>
                        <td style={{ padding: "12px", textAlign: "center", color: "var(--muted)" }}>{entry.carbs}</td>
                        <td style={{ padding: "12px", textAlign: "center", color: "var(--muted)" }}>{entry.fat}</td>
                        <td style={{ padding: "12px", textAlign: "center", color: "var(--muted)", fontSize: "0.9rem" }}>
                          {formatDate(entry.timestamp)}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => confirmDelete(entry.entryId)}
                            className="btn btn--danger"
                            style={{ fontSize: "0.85rem", padding: "6px 12px" }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Custom Delete Confirmation Modal */}
        {showDeleteModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: "#f5f5dc",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
              border: "1px solid #e0d8b8",
            }}>
              <h3 style={{
                marginTop: 0,
                marginBottom: "1rem",
                color: "#2d5016",
                fontSize: "1.2rem",
                fontWeight: 600
              }}>
                Delete Entry?
              </h3>
              <p style={{
                marginBottom: "1.5rem",
                color: "#6f4e37",
                fontSize: "0.95rem"
              }}>
                Are you sure you want to delete this entry? This will not delete the food from your library.
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
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "2px solid #e0d8b8",
                    backgroundColor: "white",
                    color: "#2d5016",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#e11d48",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Delete
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