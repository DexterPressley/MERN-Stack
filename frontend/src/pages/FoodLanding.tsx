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
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [calories, setCalories] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // For custome delete modal
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [foodToDelete, setFoodToDelete] = useState<number | null>(null);

  const userName = getUserName();

  const filteredFoods = useMemo<Food[]>(() => {
    const term = search.trim().toLowerCase();
    if (!term) return foods;
    return foods.filter((f) => f.name.toLowerCase().includes(term));
  }, [foods, search]);

  const totalCalories = useMemo<number>(
    () =>
      filteredFoods.reduce(
        (sum, f) => sum + (Number(f.caloriesPerUnit) || 0),
        0
      ),
    [filteredFoods]
  );

  useEffect(() => {
    void fetchFoods();
  }, []);

  // GET /api/users/:userId/foods
  async function fetchFoods(): Promise<void> {
    const { token, userId } = getAuth();
    if (!token || !userId) {
      setError("Missing auth: userId or token not found (check localStorage).");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/users/${userId}/foods`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // authMiddleware
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          (body as { message?: string; error?: string }).message ||
          (body as { message?: string; error?: string }).error ||
          `Failed to load foods (${res.status})`;
        throw new Error(msg);
      }

      // { success: true, results: [ { FoodID, Name, CaloriesPerUnit, ... } ], count }
      const body = (await res.json()) as {
        success: boolean;
        results?: Array<{
          FoodID: number;
          Name: string;
          CaloriesPerUnit: number;
          ProteinPerUnit: number;
          CarbsPerUnit: number;
          FatPerUnit: number;
          Unit: string;
          UPC?: string | null;
          CreatedAt?: string | null;
        }>;
        count?: number;
      };

      const results = body.results ?? [];

      const mapped: Food[] = results.map((f) => ({
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
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong loading foods."
      );
    } finally {
      setLoading(false);
    }
  }

  // POST /api/users/:userId/foods
  async function handleAdd(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const { token, userId } = getAuth();
    if (!token || !userId) {
      setError("Missing auth: userId or token not found (check localStorage).");
      return;
    }
    if (!name.trim() || !calories.trim()) return;

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/users/${userId}/foods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          caloriesPerUnit: Number(calories),
          proteinPerUnit: 0,
          carbsPerUnit: 0,
          fatPerUnit: 0,
          unit: "serving",
          upc: null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.log("Add food error response:", body);
        const msg =
          (body as { message?: string; error?: string }).message ||
          (body as { message?: string; error?: string }).error ||
          `Failed to add food (${res.status})`;
        throw new Error(msg);
      }

      await res.json().catch(() => ({}));
      await fetchFoods();

      setName("");
      setCalories("");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong adding food."
      );
    } finally {
      setLoading(false);
    }
  }

  // Show confirmation modal
  function confirmDelete(foodId: number): void {
    setFoodToDelete(foodId);
    setShowDeleteModal(true);
  }

  // DELETE /api/users/:userId/foods/:foodId
  async function handleDelete(): Promise<void> {
    if (!foodToDelete) return;

    const { token, userId } = getAuth();
    if (!token || !userId) {
      setError("Missing auth: userId or token not found (check localStorage).");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE_URL}/users/${userId}/foods/${foodToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        const msg =
          (body as { message?: string; error?: string }).message ||
          (body as { message?: string; error?: string }).error ||
          `Failed to delete food (${res.status})`;
        throw new Error(msg);
      }

      setFoods((prev) => prev.filter((f) => f.foodId !== foodToDelete));
      setShowDeleteModal(false);
      setFoodToDelete(null);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong deleting food."
      );
    } finally {
      setLoading(false);
    }
  }

  // Cancel deletion
  function cancelDelete(): void {
    setShowDeleteModal(false);
    setFoodToDelete(null);
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

        {/* Title and Total Calories */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 700, margin: 0, color: "var(--text)" }}>
            Calorie Tracker
          </h1>
          <p style={{ color: "var(--muted)", marginTop: "0.3rem", marginBottom: "0.5rem" }}>
            Search, add, and delete foods for your daily log.
          </p>
          <div style={{
            fontSize: "1.2rem",
            fontWeight: 600,
            color: "var(--brand)",
            marginTop: "0.5rem"
          }}>
            Total Calories: {totalCalories} kcal
          </div>
        </div>

        {/* Search and Add Food - Side by Side */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          marginBottom: "1.5rem"
        }}>
          {/* Search Section */}
          <div>
            <label htmlFor="food-search" style={{ fontWeight: 600, color: "var(--muted)" }}>
              Search Foods
            </label>
            <input
              id="food-search"
              type="text"
              placeholder="e.g. chicken, rice, apple..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                marginTop: "0.5rem",
                padding: "10px 12px",
                border: "2px solid var(--border)",
                borderRadius: "8px",
                fontSize: "16px",
              }}
            />
            <p style={{ marginTop: "0.4rem", fontSize: "0.85rem", color: "var(--muted)" }}>
              Filter your food entries by name
            </p>
          </div>

          {/* Add Food Form */}
          <form onSubmit={handleAdd}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text)" }}>
              Add Food Entry
            </h2>

            <label htmlFor="food-name" style={{ fontWeight: 600, color: "var(--muted)", fontSize: "0.9rem" }}>
              Food Name
            </label>
            <input
              id="food-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Banana"
              style={{
                width: "100%",
                marginTop: "0.3rem",
                marginBottom: "0.8rem",
                padding: "8px 10px",
                border: "2px solid var(--border)",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />

            <label htmlFor="food-calories" style={{ fontWeight: 600, color: "var(--muted)", fontSize: "0.9rem" }}>
              Calories
            </label>
            <input
              id="food-calories"
              type="number"
              min={0}
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="105"
              style={{
                width: "100%",
                marginTop: "0.3rem",
                marginBottom: "0.8rem",
                padding: "8px 10px",
                border: "2px solid var(--border)",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />

            <button
              type="submit"
              disabled={!name.trim() || !calories.trim()}
              className="buttons"
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: !name.trim() || !calories.trim() ? "#ccc" : "#2d5016",
                cursor: !name.trim() || !calories.trim() ? "not-allowed" : "pointer",
                opacity: !name.trim() || !calories.trim() ? 0.6 : 1,
                fontSize: "14px",
              }}
            >
              Add Food
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

        {/* Foods Table */}
        <section>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.8rem", color: "var(--text)" }}>
            Food Entries ({filteredFoods.length})
          </h2>

          {filteredFoods.length === 0 ? (
            <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
              No foods to show yet. Add your first entry above.
            </p>
          ) : (
            <div style={{
              border: "1px solid var(--border)",
              borderRadius: "10px",
              overflow: "hidden"
            }}>
              <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "12px" }}>Food</th>
                    <th style={{ textAlign: "right", padding: "12px" }}>Calories</th>
                    <th style={{ textAlign: "center", padding: "12px" }}>Date Added</th>
                    <th style={{ textAlign: "center", padding: "12px", width: "100px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFoods.map((food) => (
                    <tr key={food.foodId}>
                      <td style={{ padding: "12px", fontWeight: 500 }}>{food.name}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{food.caloriesPerUnit}</td>
                      <td style={{ padding: "12px", textAlign: "center", color: "var(--muted)", fontSize: "0.9rem" }}>
                        {formatDate(food.createdAt)}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => void confirmDelete(food.foodId)}
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
              backgroundColor: "var(--card)",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
            }}>
              <h3 style={{
                marginTop: 0,
                marginBottom: "1rem",
                color: "var(--text)",
                fontSize: "1.2rem",
                fontWeight: 600
              }}>
                Delete Food Entry?
              </h3>
              <p style={{
                marginBottom: "1.5rem",
                color: "var(--muted)",
                fontSize: "0.95rem"
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
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    backgroundColor: "white",
                    color: "var(--text)",
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

