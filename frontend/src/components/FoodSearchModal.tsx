// src/components/FoodSearchModal.tsx
import { useFoodOptional } from "../context/FoodContext";
import type { FoodItem } from "../context/FoodContext";

export default function FoodSearchModal() {
  const food = useFoodOptional();

  if (!food) return null;

  const { isSearchOpen, selectedMeal, searchResults, recentSearches, closeSearch, addFoodToMeal } = food;

  if (!isSearchOpen || !selectedMeal) return null;

  // Show search results if available, otherwise show recent searches
  const displayItems = searchResults.length > 0 ? searchResults : recentSearches;
  const headerText = searchResults.length > 0 ? "Search Results" : "Recently Added";

  const handleAddFood = async (item: FoodItem) => {
    await addFoodToMeal(selectedMeal, item);
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
          <h3 style={{ marginTop: 0, marginBottom: 4 }}>Add Food to {selectedMeal}</h3>
          <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>{headerText}</p>
        </div>

        {/* Food List */}
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
          {displayItems.length === 0 ? (
            <p style={{ color: "#6b7280", textAlign: "center", padding: 20 }}>
              {searchResults.length === 0 && recentSearches.length === 0
                ? "No recent items. Use the search bar to find foods."
                : "No items found"}
            </p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {displayItems.map((item) => {
                const calories = Math.round(item.calories || (item.protein * 4 + item.carbs * 4 + item.fats * 9));
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
                      {calories} cal • {item.unit} • P: {item.protein}g • C: {item.carbs}g • F: {item.fats}g
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
