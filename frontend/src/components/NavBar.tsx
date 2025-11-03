import React from "react";
import { useFoodOptional } from "../context/FoodContext";

// Define the meal list locally to avoid type-only import problems
const MEALS = ["Breakfast", "Snack 1", "Lunch", "Snack 2", "Dinner"] as const;
type MealType = typeof MEALS[number];

export default function NavBar() {
  const food = useFoodOptional();
  const [target, setTarget] = React.useState<MealType>("Breakfast");

  function open() {
    if (food) food.openSearch(target);
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "#fff",
        borderBottom: "1px solid #eee",
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <strong style={{ marginRight: 8 }}>MERN Fitness</strong>

        <select
          value={target}
          onChange={(e) => setTarget(e.target.value as MealType)}
          style={{ padding: 6, borderRadius: 8, border: "1px solid #ddd" }}
        >
          {MEALS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <button
          onClick={open}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: "#f9f9f9",
            cursor: "pointer",
          }}
        >
          Quick Add
        </button>

        <div style={{ flex: 1 }} />
      </div>
    </header>
  );
}
