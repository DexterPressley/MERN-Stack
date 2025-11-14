// src/pages/FoodLanding.tsx

import React, {
  useEffect,
  useMemo,
  useState,
  FormEvent,
} from "react";
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

const FoodLanding: React.FC = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [calories, setCalories] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

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

  // DELETE /api/users/:userId/foods/:foodId
  async function handleDelete(foodId: number): Promise<void> {
    const { token, userId } = getAuth();
    if (!token || !userId) {
      setError("Missing auth: userId or token not found (check localStorage).");
      return;
    }

    const ok = window.confirm("Delete this food entry?");
    if (!ok) return;

    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE_URL}/users/${userId}/foods/${foodId}`,
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

      setFoods((prev) => prev.filter((f) => f.foodId !== foodId));
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

  return (
    <div
      style={{
        minHeight: "100vh",
        margin: 0,
        padding: "2rem 1rem",
        background:
          "radial-gradient(circle at top left, #22c55e 0, transparent 55%), radial-gradient(circle at bottom right, #f97316 0, #020617 55%)",
        display: "flex",
        justifyContent: "center",
        boxSizing: "border-box",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, system-ui, "SF Pro Text", sans-serif',
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "960px",
          background: "rgba(15, 23, 42, 0.96)",
          borderRadius: "1.5rem",
          padding: "2rem",
          boxShadow:
            "0 24px 60px rgba(15, 23, 42, 0.7), 0 0 0 1px rgba(148, 163, 184, 0.18)",
          color: "#f9fafb",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "2rem",
            alignItems: "center",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.9rem",
                fontWeight: 700,
                letterSpacing: "-0.03em",
              }}
            >
              Calorie Tracker
            </h1>
            <p style={{ color: "#9ca3af", marginTop: "0.3rem" }}>
              Search, add, and delete foods for your daily log.
            </p>
          </div>
          <div
            style={{
              textAlign: "right",
              minWidth: "160px",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#6b7280",
                marginBottom: "0.25rem",
              }}
            >
              Total calories
            </div>
            <div
              style={{
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "#bbf7d0",
              }}
            >
              {totalCalories}
              <span
                style={{
                  fontSize: "0.8rem",
                  marginLeft: "0.25rem",
                  color: "#9ca3af",
                }}
              >
                kcal
              </span>
            </div>
          </div>
        </header>

        {/* Controls: search + add */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.4fr)",
            gap: "1.5rem",
            marginBottom: "1.75rem",
          }}
        >
          {/* Search */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.95)",
              borderRadius: "1rem",
              padding: "1rem",
              border: "1px solid rgba(148, 163, 184, 0.35)",
            }}
          >
            <label
              htmlFor="food-search"
              style={{ fontSize: "0.8rem", color: "#9ca3af" }}
            >
              Search foods
            </label>
            <input
              id="food-search"
              type="text"
              placeholder="e.g. chicken, rice, apple..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                marginTop: "0.4rem",
                width: "100%",
                padding: "0.65rem 0.85rem",
                borderRadius: "0.7rem",
                border: "1px solid rgba(55, 65, 81, 0.95)",
                background: "#020617",
                color: "#f9fafb",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
            <p
              style={{
                marginTop: "0.4rem",
                fontSize: "0.75rem",
                color: "#6b7280",
              }}
            >
              Filtering is client-side. Clear the search to see all entries.
            </p>
          </div>

          {/* Add food */}
          <form
            onSubmit={handleAdd}
            style={{
              background: "rgba(15, 23, 42, 0.95)",
              borderRadius: "1rem",
              padding: "1rem",
              border: "1px solid rgba(148, 163, 184, 0.35)",
            }}
          >
            <h2
              style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                marginBottom: "0.7rem",
              }}
            >
              Add food entry
            </h2>

            <div style={{ marginBottom: "0.65rem" }}>
              <label
                htmlFor="food-name"
                style={{ fontSize: "0.8rem", color: "#9ca3af" }}
              >
                Name
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
                  padding: "0.6rem 0.85rem",
                  borderRadius: "0.7rem",
                  border: "1px solid rgba(55, 65, 81, 0.95)",
                  background: "#020617",
                  color: "#f9fafb",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "0.9rem" }}>
              <label
                htmlFor="food-calories"
                style={{ fontSize: "0.8rem", color: "#9ca3af" }}
              >
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
                  padding: "0.6rem 0.85rem",
                  borderRadius: "0.7rem",
                  border: "1px solid rgba(55, 65, 81, 0.95)",
                  background: "#020617",
                  color: "#f9fafb",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim() || !calories.trim()}
              style={{
                width: "100%",
                padding: "0.7rem 1rem",
                borderRadius: "0.8rem",
                border: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor:
                  name.trim() && calories.trim() ? "pointer" : "not-allowed",
                opacity: name.trim() && calories.trim() ? 1 : 0.5,
                background:
                  "linear-gradient(to right, #22c55e, #86efac, #22c55e)",
                backgroundSize: "200% auto",
                color: "#052e16",
                transition: "transform 0.1s ease, box-shadow 0.1s ease",
              }}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.97)")
              }
              onMouseUp={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              Add food
            </button>
          </form>
        </div>

        {/* Status */}
        {error && (
          <div
            style={{
              marginBottom: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.8rem",
              background: "rgba(248, 113, 113, 0.12)",
              border: "1px solid rgba(248, 113, 113, 0.7)",
              color: "#fecaca",
              fontSize: "0.85rem",
            }}
          >
            {error}
          </div>
        )}
        {loading && (
          <div
            style={{
              marginBottom: "0.75rem",
              fontSize: "0.85rem",
              color: "#9ca3af",
            }}
          >
            Loading…
          </div>
        )}

        {/* Foods table */}
        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.6rem",
              alignItems: "center",
            }}
          >
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>
              Entries ({filteredFoods.length})
            </h2>
            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
              Showing filtered results{search ? ` for "${search}"` : ""}.
            </span>
          </div>

          {filteredFoods.length === 0 ? (
            <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
              No foods to show yet. Add your first entry on the right.
            </p>
          ) : (
            <div
              style={{
                borderRadius: "1rem",
                border: "1px solid rgba(55, 65, 81, 0.95)",
                overflow: "hidden",
                background: "rgba(15, 23, 42, 0.98)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.9rem",
                }}
              >
                <thead
                  style={{
                    background:
                      "linear-gradient(to right, rgba(15, 23, 42, 1), rgba(15, 23, 42, 0.8))",
                  }}
                >
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "0.75rem 1rem",
                        fontWeight: 500,
                        color: "#9ca3af",
                      }}
                    >
                      Food
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "0.75rem 1rem",
                        fontWeight: 500,
                        color: "#9ca3af",
                      }}
                    >
                      Calories
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "0.75rem 0.75rem",
                        fontWeight: 500,
                        color: "#9ca3af",
                        width: "80px",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFoods.map((food) => (
                    <tr
                      key={food.foodId}
                      style={{
                        borderTop: "1px solid rgba(31, 41, 55, 0.9)",
                      }}
                    >
                      <td
                        style={{
                          padding: "0.7rem 1rem",
                          fontWeight: 500,
                        }}
                      >
                        {food.name}
                      </td>
                      <td
                        style={{
                          padding: "0.7rem 1rem",
                          textAlign: "right",
                          color: "#e5e7eb",
                        }}
                      >
                        {food.caloriesPerUnit}
                      </td>
                      <td
                        style={{
                          padding: "0.6rem 0.75rem",
                          textAlign: "center",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => void handleDelete(food.foodId)}
                          style={{
                            borderRadius: "999px",
                            border:
                              "1px solid rgba(248, 113, 113, 0.75)",
                            background: "rgba(127, 29, 29, 0.6)",
                            color: "#fecaca",
                            padding: "0.25rem 0.7rem",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                          }}
                        >
                          🗑 Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default FoodLanding;

