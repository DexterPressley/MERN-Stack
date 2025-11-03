import React from "react";
import type { MealType } from "../context/FoodContext";
import { useFoodOptional } from "../context/FoodContext";


export default function MealSection({ title }: { title: MealType }) {
  const food = useFoodOptional();
  if (!food) {
    return (
      <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <h2>{title}</h2>
        <p style={{ color: "#6b7280" }}>No items yet.</p>
      </section>
    );
  }

  const { meals, openSearch, removeFoodFromMeal } = food;
  const items = meals[title] ?? [];

  return (
    <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <button
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #ddd",
            cursor: "pointer",
            background: "#f9f9f9",
          }}
          onClick={() => openSearch(title)}
        >
          + Add Food
        </button>
      </div>

      {items.length === 0 ? (
        <p style={{ color: "#6b7280", marginTop: 8 }}>No items yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
          {items.map((m) => {
            const cal = m.protein * 4 + m.carbs * 4 + m.fats * 9;
            return (
              <li
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #eee",
                  padding: "4px 0",
                }}
              >
                <div>
                  <strong>{m.name}</strong>{" "}
                  <span style={{ color: "#6b7280" }}>
                    P {m.protein} C {m.carbs} F {m.fats}
                  </span>
                </div>
                <div>
                  <span style={{ marginRight: 10 }}>{cal} kcal</span>
                  <button
                    style={{
                      border: "none",
                      background: "none",
                      color: "#3b82f6",
                      cursor: "pointer",
                    }}
                    onClick={() => removeFoodFromMeal(title, m.id)}
                  >
                    remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


