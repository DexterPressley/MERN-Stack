// src/components/MealNavBar.tsx
import React from "react";
import type { MealType } from "../context/FoodContext";
import { useFood } from "../context/FoodContext";

const MEALS: MealType[] = ["Breakfast", "Snack 1", "Lunch", "Snack 2", "Dinner"];

export default function MealNavBar() {
  const { selectedMeal, setSelectedMeal } = useFood();

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <span style={{ fontWeight: 600, marginRight: 8, color: "#374151" }}>
        Select Meal:
      </span>
      
      {MEALS.map((meal) => (
        <button
          key={meal}
          onClick={() => setSelectedMeal(meal)}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: selectedMeal === meal ? "2px solid #667eea" : "1px solid #e5e7eb",
            background: selectedMeal === meal ? "#667eea" : "white",
            color: selectedMeal === meal ? "white" : "#374151",
            fontWeight: selectedMeal === meal ? "600" : "normal",
            cursor: "pointer",
            fontSize: 14,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (selectedMeal !== meal) {
              e.currentTarget.style.background = "#f9fafb";
            }
          }}
          onMouseLeave={(e) => {
            if (selectedMeal !== meal) {
              e.currentTarget.style.background = "white";
            }
          }}
        >
          {meal}
        </button>
      ))}
    </div>
  );
}