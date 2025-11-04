// src/pages/DashboardPage.tsx
import React from "react";
import { FoodProvider } from "../context/FoodContext";
import CalendarWidget from "../components/CalendarWidget";
import MacroBar from "../components/MacroProgressBar";
import MealSection from "../components/MealSection";
import MealNavBar from "../components/MealNavBar";
import FoodSearchModal from "../components/FoodSearchModal";
// import NavBar from "../components/NavBar";

export default function DashboardPage() {
  return (
    <FoodProvider>
      {/* <NavBar /> */}
      <div style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980, margin: "0 auto" }}>
        <h1>Your Day</h1>
        <CalendarWidget />
        <MacroBar />
        <MealNavBar />
        
        {/* ✅ NEW: Display all 5 meals */}
        <div style={{ display: "grid", gap: 16 }}>
          <MealSection title="Breakfast" />
          <MealSection title="Snack 1" />
          <MealSection title="Lunch" />
          <MealSection title="Snack 2" />
          <MealSection title="Dinner" />
        </div>
      </div>
      <FoodSearchModal />
    </FoodProvider>
  );
}
