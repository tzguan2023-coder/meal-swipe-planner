import './App.css';

import React, { useState, useEffect } from 'react';

// Holidays list
const HOLIDAYS = [
  { label: 'Labor Day', days: 3, dates: ['20250830', '20250831', '20250901'] },
  { label: 'Columbus Day', days: 3, dates: ['20251011', '20251012', '20251013'] },
  { label: 'Veterans Day', days: 1, dates: ['20251111'] },
  { label: 'Thanksgiving', days: 5, dates: ['20251126', '20251127', '20251128', '20251129', '20251130'] },
  { label: "Presidents' Day", days: 3, dates: ['20260214', '20260215', '20260216'] },
  { label: "Spring Recess", days: 9, dates: ['20260314','20260315','20260316','20260317','20260318','20260319','20260320','20260321','20260322'] },
  { label: 'Memorial Day', days: 3, dates: ['20260523', '20260524', '20260525'] },
];

function parseDateInput(str) {
  if (str.length !== 8) return null;
  return new Date(
    Number(str.slice(0, 4)),
    Number(str.slice(4, 6)) - 1,
    Number(str.slice(6, 8))
  );
}
function isBetween(d, start, end) {
  return d >= start && d <= end;
}

const STORAGE_KEY = 'meal_swipe_local_save';

function App() {
  // Local cache
  const loadSaved = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved || {};
    } catch {
      return {};
    }
  };
  // 状态变量（带本地持久化）
  const [startDate, setStartDate] = useState(loadSaved().startDate || '20250824');
  const [endDate, setEndDate] = useState(loadSaved().endDate || '20251222');
  const [totalMeal, setTotalMeal] = useState(loadSaved().totalMeal || '283');
  const [remainMeal, setRemainMeal] = useState(loadSaved().remainMeal || '50');
  const [selected, setSelected] = useState(loadSaved().selected || HOLIDAYS.map(h => h.label));

  // 自动保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ startDate, endDate, totalMeal, remainMeal, selected }));
  }, [startDate, endDate, totalMeal, remainMeal, selected]);

  // Today's date
  const now = new Date();
  const todayStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  // Holidays within the school year
  const availableHolidays = HOLIDAYS.filter(h =>
    h.dates.some(d => isBetween(d, startDate, endDate))
  );

  let usedHolidayDays = 0;
  let remainHolidayDays = 0;
  availableHolidays.forEach(h => {
    if (!selected.includes(h.label)) return;
    h.dates.forEach(d => {
      if (d < todayStr) usedHolidayDays += 1;
      else if (d >= todayStr && d <= endDate) remainHolidayDays += 1;
    });
  });

  const start = parseDateInput(startDate);
  const end = parseDateInput(endDate);
  const today = parseDateInput(todayStr);

  let usedDays = 0, remainDays = 0;
  if (start && end && today) {
    usedDays = Math.max(0, Math.ceil((today.getTime() - start.getTime()) / (1000 * 3600 * 24))) - usedHolidayDays;
    remainDays = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / (1000 * 3600 * 24))) - remainHolidayDays;
  }

  const usedMeal = parseInt(totalMeal) - parseInt(remainMeal);
  const avgUsed = usedDays > 0 ? (usedMeal / usedDays).toFixed(2) : '--';
  const avgRemain = remainDays > 0 ? (parseInt(remainMeal) / remainDays).toFixed(2) : '--';
  const futureLeft = remainDays > 0 ? (parseInt(remainMeal) - Number(avgUsed) * remainDays).toFixed(1) : '--';

  const toggleHoliday = (label) => {
    setSelected(selected.includes(label)
      ? selected.filter(l => l !== label)
      : [...selected, label]
    );
  };

  return (
    <div style={{ maxWidth: 500, margin: "20px auto", padding: 20, background: "#f7f7f7", borderRadius: 16, boxShadow: "0 0 12px #ddd" }}>
      <h2>Meal Swipe Planner™ (Web) </h2>
      <label>Semester start date(YEAR/MONTH/DATE 8 digit): </label>
      <input value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="20250824" maxLength={8} style={{ width: 160 }} /><br />
      <label>Semester end date(YEAR/MONTH/DATE 8 digit): </label>
      <input value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="20251222" maxLength={8} style={{ width: 160 }} /><br />
      <label>Total meal swipes: </label>
      <input value={totalMeal} onChange={e => setTotalMeal(e.target.value)} style={{ width: 100 }} /><br />
      <label>Meal swipes left: </label>
      <input value={remainMeal} onChange={e => setRemainMeal(e.target.value)} style={{ width: 100 }} /><br />
      <div style={{ color: '#888', marginBottom: 8 }}>Today: {todayStr}</div>

      <b>Holidays away from campus (Select the holidays when you will be completely off campus.)</b>
      <div>
        {availableHolidays.map(h =>
          <div key={h.label} style={{ display: "flex", alignItems: "center", marginBottom: 3 }}>
            <span
              onClick={() => toggleHoliday(h.label)}
              style={{ cursor: "pointer", fontSize: 18, color: selected.includes(h.label) ? "#007aff" : "#999" }}>
              {selected.includes(h.label) ? "☑" : "☐"}
            </span>
            <span style={{ marginLeft: 7 }}>{h.label}({h.days}Days)</span>
          </div>
        )}
      </div>

      <div style={{ margin: "20px 0", background: "#e6f0ff", borderRadius: 8, padding: 10 }}>
        <b>1. Usage So Far: </b><br />
        Days elapsed (excluding holidays): {usedDays}<br />
        Meal swipes already used: {usedMeal}<br />
        Average use per day: {avgUsed}
      </div>
      <div style={{ margin: "20px 0", background: "#e6f0ff", borderRadius: 8, padding: 10 }}>
        <b>2. Remaining: </b><br />
        Days remaining (excluding holidays): {remainDays}<br />
        Meal swipes remaining: {remainMeal}<br />
        Recommend to use less than: {avgRemain} swipes per day
      </div>
      <div style={{ margin: "20px 0", background: "#e6f0ff", borderRadius: 8, padding: 10 }}>
        <b>3. End-of-Semester Projection: </b><br />
        {futureLeft !== '--' &&
          <>At your current pace, you'll
            {Number(futureLeft) > 0 ? ' will leave unused ' : ' will be a lack of '}
            {Math.abs(Number(futureLeft))} meal swipes when the semester ends.</>
        }
      </div>
      <div style={{ color: "#ccc", fontSize: 12, textAlign: "right" }}>© 2025 Tim Guan — Meal Swipe Planner™ / <a href="https://github.com/" style={{color:'#aac'}}>GitHub</a></div>
    </div>
  );
}

export default App;
