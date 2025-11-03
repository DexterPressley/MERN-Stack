// src/components/FoodSearchModal.tsx
import React from "react";
import { useFoodOptional } from "../context/FoodContext";
import type { FoodItem } from "../context/FoodContext";

// Mock food database - later you can replace with API call
const FOOD_DATABASE: FoodItem[] = [
  { id: "1", name: "Chicken Breast (100g)", protein: 31, carbs: 0, fats: 3.6 },
  { id: "2", name: "Brown Rice (1 cup)", protein: 5, carbs: 45, fats: 2 },
  { id: "3", name: "Banana", protein: 1, carbs: 27, fats: 0.3 },
  { id: "4", name: "Eggs (2 large)", protein: 12, carbs: 1, fats: 10 },
  { id: "5", name: "Oatmeal (1 cup)", protein: 6, carbs: 27, fats: 3 },
  { id: "6", name: "Salmon (100g)", protein: 25, carbs: 0, fats: 13 },
  { id: "7", name: "Broccoli (1 cup)", protein: 3, carbs: 6, fats: 0.3 },
  { id: "8", name: "Almonds (28g)", protein: 6, carbs: 6, fats: 14 },
  { id: "9", name: "Greek Yogurt (170g)", protein: 17, carbs: 9, fats: 0 },
  { id: "10", name: "Sweet Potato (medium)", protein: 2, carbs: 26, fats: 0 },
  { id: "11", name: "Apple", protein: 0.5, carbs: 25, fats: 0.3 },
  { id: "12", name: "Peanut Butter (2 tbsp)", protein: 8, carbs: 7, fats: 16 },
];

export default function FoodSearchModal() {
  const food = useFoodOptional();
  const [searchQuery, setSearchQuery] = React.useState("");

  if (!food) return null;

  const { isSearchOpen, selectedMeal, closeSearch, addFoodToMeal } = food;

  if (!isSearchOpen || !selectedMeal) return null;

  // Filter foods based on search query
  const filteredFoods = searchQuery.trim()
    ? FOOD_DATABASE.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : FOOD_DATABASE;

  const handleAddFood = (item: FoodItem) => {
    // Create unique ID with timestamp to allow duplicates
    const uniqueItem = { ...item, id: `${item.id}-${Date.now()}` };
    addFoodToMeal(selectedMeal, uniqueItem);
    setSearchQuery("");
    closeSearch();
  };

  return (
    <div
      onClick={closeSearch}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          width: "90%",
          maxWidth: 500,
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0,0,0,.3)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Add Food to {selectedMeal}</h3>
          
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "2px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Food List */}
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
          {filteredFoods.length === 0 ? (
            <p style={{ color: "#6b7280", textAlign: "center", padding: 20 }}>
              No foods found
            </p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {filteredFoods.map((item) => {
                const calories = item.protein * 4 + item.carbs * 4 + item.fats * 9;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleAddFood(item)}
                    style={{
                      padding: 12,
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      background: "white",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f9fafb";
                      e.currentTarget.style.borderColor = "#667eea";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                      {calories} cal • P: {item.protein}g • C: {item.carbs}g • F: {item.fats}g
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={closeSearch}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}