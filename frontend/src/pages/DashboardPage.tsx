// src/pages/DashboardPage.tsx
import { FoodProvider } from "../context/FoodContext";
import CalendarWidget from "../components/CalendarWidget";
import MacroBar from "../components/MacroProgressBar";
import MealSection from "../components/MealSection";
import MealNavBar from "../components/MealNavBar";
import FoodSearchModal from "../components/FoodSearchModal";

export default function DashboardPage() {
  return (
    <FoodProvider>
      <div
        style={{
          minHeight: "100vh",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.2), rgba(255,255,255,0.20)), url('https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1600')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980, margin: "0 auto" }}>
          <h1>Your Day</h1>
          <CalendarWidget />
          <MacroBar />
          <MealNavBar />
          
          <div style={{ display: "grid", gap: 16 }}>
            <MealSection title="Snack" />
            <MealSection title="Breakfast" />
            <MealSection title="Lunch" />
            <MealSection title="Dinner" />
          </div>
        </div>
      </div>
      <FoodSearchModal />
    </FoodProvider>
  );
}