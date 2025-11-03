import React from "react";
import { useFoodOptional } from "../context/FoodContext";

export default function MacroProgressBar() {
  const food = useFoodOptional();
  if (!food) {
    return (
      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
        Macro (no provider)
      </div>
    );
  }

  const { totals, dailyGoal, setDailyGoal } = food;
  const { protein, carbs, fats } = totals;

  const proteinCal = protein * 4;
  const carbCal   = carbs * 4;
  const fatCal    = fats * 9;
  const eaten     = proteinCal + carbCal + fatCal;

  const goal = Math.max(1, Number.isFinite(dailyGoal) ? dailyGoal : 0);
  const pct  = Math.min(100, Math.round((eaten / goal) * 100));

  const proteinPct = (proteinCal / goal) * 100;
  const carbPct    = (carbCal   / goal) * 100;
  const fatPct     = (fatCal    / goal) * 100;

  return (
    <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Total Calories</h2>

      <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
        <label style={{ display: "grid" }}>
          <span style={{ color: "#6b7280" }}>Daily Goal</span>
          <input
            type="number"
            min={100}
            value={goal}
            onChange={(e) => setDailyGoal(Math.max(100, parseInt(e.target.value || "0", 10)))}
            style={{ padding: 8, border: "1px solid #e5e7eb", borderRadius: 8, width: 140 }}
          />
        </label>
        <div><div style={{ color: "#6b7280" }}>Eaten</div><strong>{eaten} kcal</strong></div>
        <div><div style={{ color: "#6b7280" }}>Remaining</div><strong>{Math.max(goal - eaten, 0)} kcal</strong></div>
        <div><div style={{ color: "#6b7280" }}>Progress</div><strong>{pct}%</strong></div>
      </div>

      <div style={{ background: "#e5e7eb", height: 16, borderRadius: 999, overflow: "hidden" }}>
        <div style={{ display: "flex", height: "100%", width: `${pct}%`, transition: "width .2s" }}>
          <div style={{ width: `${proteinPct}%`, background: "#60a5fa" }} />
          <div style={{ width: `${carbPct}%`,    background: "#facc15" }} />
          <div style={{ width: `${fatPct}%`,     background: "#f87171" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 8, color: "#6b7280", flexWrap: "wrap" }}>
        <span>Protein: {protein}g</span>
        <span>Carbs: {carbs}g</span>
        <span>Fats: {fats}g</span>
      </div>
    </section>
  );
}

