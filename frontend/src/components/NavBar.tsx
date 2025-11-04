import React from "react";
import { useFood } from "../context/FoodContext";

export default function NavBar() {
  let food: ReturnType<typeof useFood> | null = null;
  try { food = useFood(); } catch { /* NavBar can render w/o provider (e.g., on login) */ }

  function handleSearch() {
    food?.openSearch(food.selectedMeal ?? "Breakfast");
  }

  function handleLogout() {
    localStorage.removeItem("user_data");
    localStorage.removeItem("token_data");
    window.location.href = "/";
  }

  return (
    <header className="topbar">
      <div className="topbar-left">MERN Fitness</div>
      <div className="topbar-right">
        {food && <button className="secondary" onClick={handleSearch}>Search Food</button>}
        <button className="link" onClick={handleLogout}>Log Out</button>
      </div>
    </header>
  );
}
