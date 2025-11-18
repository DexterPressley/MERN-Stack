// src/components/MealNavBar.tsx
import React from "react";
import type { MealType, FoodItem } from "../context/FoodContext";
import { useFood } from "../context/FoodContext";

const MEALS: MealType[] = ["Snack", "Breakfast", "Lunch", "Dinner"];

export default function MealNavBar() {
  const { selectedMeal, setSelectedMeal, openSearch, addFoodToMeal, searchFoods, searchResults } = useFood();
  const [query, setQuery] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Search database as user types
  const handleInputChange = async (value: string) => {
    setQuery(value);
    
    if (value.trim().length > 1) {
      // Search backend database
      await searchFoods(value);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Add food directly from suggestion
  const handleSelectSuggestion = async (item: FoodItem) => {
    if (!selectedMeal) {
      alert("Please select a meal first!");
      return;
    }
    await addFoodToMeal(selectedMeal, item);
    setQuery("");
    setShowSuggestions(false);
  };

  // Search button opens modal with all results
  const handleSearchAll = () => {
    if (!selectedMeal) {
      alert("Please select a meal first!");
      return;
    }
    openSearch(selectedMeal);
  };

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      await handleSelectSuggestion(searchResults[0]);
    }
  };

  // Use searchResults from context (top 8)
  const suggestions = searchResults.slice(0, 8);

  return (
    <div
      style={{
        border: "1px solid #d1d5db",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      {/* Meal Selection Buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600, marginRight: 8, color: "#374151", lineHeight: "40px" }}>
          Select Meal:
        </span>
        
        {MEALS.map((meal) => (
          <button
            key={meal}
            onClick={() => setSelectedMeal(meal)}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: selectedMeal === meal ? "2px solid #667eea" : "1px solid #d1d5db",
              background: selectedMeal === meal ? "#667eea" : "white",
              color: selectedMeal === meal ? "white" : "#374151",
              fontWeight: selectedMeal === meal ? "600" : "normal",
              cursor: "pointer",
              fontSize: 14,
              transition: "all 0.2s",
            }}
          >
            {meal}
          </button>
        ))}
      </div>

      {/* Search Bar with Suggestions */}
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            type="text"
            placeholder={selectedMeal ? `Type to search food for ${selectedMeal}...` : "Select a meal first"}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => query.trim() && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            disabled={!selectedMeal}
            style={{
              flex: 1,
              padding: "10px 12px",
              border: "2px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
              background: selectedMeal ? "white" : "#f9fafb",
              outline: "none",
            }}
          />
          <button
            onClick={handleSearchAll}
            disabled={!selectedMeal}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: selectedMeal ? "#667eea" : "#e5e7eb",
              color: selectedMeal ? "white" : "#9ca3af",
              cursor: selectedMeal ? "pointer" : "not-allowed",
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            🔍 Browse All
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 60,
              marginTop: 4,
              background: "white",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              maxHeight: 300,
              overflowY: "auto",
              zIndex: 10,
            }}
          >
            {suggestions.map((item) => {
              const calories = Math.round(item.calories || (item.protein * 4 + item.carbs * 4 + item.fats * 9));
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectSuggestion(item)}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f3f4f6",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {calories} cal • P: {item.protein}g • C: {item.carbs}g • F: {item.fats}g
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
