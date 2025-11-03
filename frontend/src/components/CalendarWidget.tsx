// src/components/CalendarWidget.tsx
import React from "react";

function CalendarWidget() {
  const today = new Date();
  
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = today.toLocaleDateString('en-US', { month: 'long' });
  const date = today.getDate();
  const year = today.getFullYear();

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        textAlign: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
      }}
    >
      <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 4 }}>
        {dayName}
      </div>
      <div style={{ fontSize: 32, fontWeight: "bold", marginBottom: 4 }}>
        {date}
      </div>
      <div style={{ fontSize: 16, opacity: 0.9 }}>
        {monthName} {year}
      </div>
    </div>
  );
}

export default CalendarWidget;