// src/components/MacroProgressBar.tsx
import React from "react";
import { useFoodOptional } from "../context/FoodContext";

export default function MacroProgressBar() {
  const food = useFoodOptional();
  if (!food) {
    return (
      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, background: "white" }}>
        Macro (no provider)
      </div>
    );
  }

  const { totals, dailyGoal, setDailyGoal } = food;
  const { protein, carbs, fats } = totals;
  const proteinCal = protein * 4;
  const carbCal = carbs * 4;
  const fatCal = fats * 9;
  const eaten = proteinCal + carbCal + fatCal;
  const goal = Math.max(1, Number.isFinite(dailyGoal) ? dailyGoal : 0);
  const pct = Math.min(100, Math.round((eaten / goal) * 100));
  const proteinPct = (proteinCal / goal) * 100;
  const carbPct = (carbCal / goal) * 100;
  const fatPct = (fatCal / goal) * 100;

  return (
    <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16, background: "white" }}>
      <h2 style={{ marginTop: 0 }}>Total Calories</h2>
      <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
        <label style={{ display: "grid" }}>
          <span style={{ color: "#6b7280", fontSize: 14 }}>Daily Goal</span>
          <input
            id="dailyGoalInput"
            name="dailyGoal"
            type="number"
            min={100}
            value={goal}
            onChange={(e) => setDailyGoal(Math.max(100, parseInt(e.target.value || "0", 10)))}
            style={{ padding: 8, border: "1px solid #e5e7eb", borderRadius: 8, width: 140 }}
          />
        </label>
        <div><div style={{ color: "#6b7280", fontSize: 14 }}>Eaten</div><strong>{eaten} cal</strong></div>
        <div><div style={{ color: "#6b7280", fontSize: 14 }}>Remaining</div><strong>{Math.max(goal - eaten, 0)} cal</strong></div>
        <div><div style={{ color: "#6b7280", fontSize: 14 }}>Progress</div><strong>{pct}%</strong></div>
      </div>

      {/* Progress bar */}
      <div style={{ background: "#e5e7eb", height: 20, borderRadius: 999, overflow: "hidden", marginBottom: 12 }}>
        <div style={{ display: "flex", height: "100%", width: `${pct}%`, transition: "width .2s" }}>
          <div style={{ width: `${proteinPct}%`, background: "#60a5fa" }} title="Protein" />
          <div style={{ width: `${carbPct}%`, background: "#facc15" }} title="Carbs" />
          <div style={{ width: `${fatPct}%`, background: "#f87171" }} title="Fats" />
        </div>
      </div>

      {/* Legend with colors */}
      <div style={{ display: "flex", gap: 20, fontSize: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 16, background: "#60a5fa", borderRadius: 4 }} />
          <span><strong>Protein:</strong> {protein}g ({proteinCal} cal)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 16, background: "#facc15", borderRadius: 4 }} />
          <span><strong>Carbs:</strong> {carbs}g ({carbCal} cal)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 16, background: "#f87171", borderRadius: 4 }} />
          <span><strong>Fats:</strong> {fats}g ({fatCal} cal)</span>
        </div>
      </div>
    </section>
  );
}

