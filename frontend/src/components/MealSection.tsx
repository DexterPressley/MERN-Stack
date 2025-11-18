// src/components/MealSection.tsx
import type { MealType } from "../context/FoodContext";
import { useFoodOptional } from "../context/FoodContext";

export default function MealSection({ title }: { title: MealType }) {
  const food = useFoodOptional();
  if (!food) {
    return (
      <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "white" }}>
        <h2>{title}</h2>
        <p style={{ color: "#6b7280" }}>No items yet.</p>
      </section>
    );
  }

  const { meals, openSearch, removeFoodFromMeal } = food;
  const items = meals[title] || [];

  const handleRemove = (foodId: string, foodName: string) => {
    if (window.confirm(`Remove "${foodName}" from ${title}?`)) {
      removeFoodFromMeal(title, foodId);
    }
  };

  return (
    <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "white" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <button
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #667eea",
            cursor: "pointer",
            background: "#667eea",
            color: "white",
            fontWeight: "600",
          }}
          onClick={() => openSearch(title)}
        >
          + Add Food
        </button>
      </div>
      {items.length === 0 ? (
        <p style={{ color: "#6b7280", marginTop: 8 }}>No items yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
          {items.map((m) => {
            const cal = Math.round(m.protein * 4 + m.carbs * 4 + m.fats * 9);
            return (
              <li
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #f3f4f6",
                  padding: "12px 0",
                }}
              >
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 15 }}>{m.name}</strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ color: "#6b7280", fontSize: 14 }}>{cal} cal</span>
                  <button
                    style={{
                      border: "none",
                      background: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: "500",
                    }}
                    onClick={() => handleRemove(m.id, m.name)}
                  >
                    Remove
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
