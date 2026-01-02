import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

// --- 配置数据 ---
const HOLIDAYS = [
  { label: 'Labor Day', dates: ['20250830', '20250831', '20250901'] },
  { label: 'Columbus Day', dates: ['20251011', '20251012', '20251013'] },
  { label: 'Veterans Day', dates: ['20251111'] },
  { label: 'Thanksgiving', dates: ['20251126', '20251127', '20251128', '20251129', '20251130'] },
  { label: "Presidents' Day", dates: ['20260214', '20260215', '20260216'] },
  { label: "Spring Recess", dates: ['20260314','20260315','20260316','20260317','20260318','20260319','20260320','20260321','20260322'] },
  { label: "Good Friday", dates: ['20260403', '20260404', '20260405'] },
  { label: 'Memorial Day', dates: ['20260523', '20260524', '20260525'] },
];

const STORAGE_KEY = 'meal_swipe_v2_save';

// --- 工具函数 ---
const parseDateStr = (str) => {
  if (!str || str.length !== 8) return null;
  return new Date(Number(str.slice(0, 4)), Number(str.slice(4, 6)) - 1, Number(str.slice(6, 8)));
};

const toDateStr = (date) => {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

// --- 组件: 日历选择模态框 ---
const CalendarModal = ({ isOpen, onClose, selectedDates, onToggleDate, onClearAll }) => {
  const [viewDate, setViewDate] = useState(new Date());

  if (!isOpen) return null;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = new Date(year, month, 1).getDay(); 

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="cal-cell empty"></div>);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const currentStr = toDateStr(new Date(year, month, d));
    const isSelected = selectedDates.includes(currentStr);
    const isToday = currentStr === toDateStr(new Date());
    
    days.push(
      <div 
        key={d} 
        className={`cal-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
        onClick={() => onToggleDate(currentStr)}
      >
        {d}
      </div>
    );
  }

  const handleClear = () => {
    if (window.confirm("Are you sure you want to remove ALL custom holidays?")) {
      onClearAll();
    }
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="cal-header">
          <button className="btn btn-outline" onClick={handlePrevMonth}>&lt;</button>
          <div style={{fontWeight: 'bold', fontSize: 18}}>{monthNames[month]} {year}</div>
          <button className="btn btn-outline" onClick={handleNextMonth}>&gt;</button>
        </div>
        
        <div className="cal-grid">
            {['S','M','T','W','T','F','S'].map((n, i) => (
                <div key={i} className="cal-day-name">{n}</div>
            ))}
            {days}
        </div>

        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <button className="btn btn-danger" onClick={handleClear}>Clear All</button>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
        <div style={{marginTop: 10, fontSize: 12, color: '#888', textAlign: 'center'}}>
          Selected: {selectedDates.length} days
        </div>
      </div>
    </div>
  );
};

// --- 主应用 ---
function App() {
  const loadSaved = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch { return {}; }
  };

  const saved = loadSaved();
  const [startDate, setStartDate] = useState(saved.startDate || '20250824');
  const [endDate, setEndDate] = useState(saved.endDate || '20251222');
  const [totalMeal, setTotalMeal] = useState(saved.totalMeal || '283');
  const [remainMeal, setRemainMeal] = useState(saved.remainMeal || '50');
  const [selectedHolidays, setSelectedHolidays] = useState(saved.selectedHolidays || HOLIDAYS.map(h => h.label));
  const [customDates, setCustomDates] = useState(saved.customDates || []);
  
  const [isCalOpen, setIsCalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      startDate, endDate, totalMeal, remainMeal, selectedHolidays, customDates 
    }));
  }, [startDate, endDate, totalMeal, remainMeal, selectedHolidays, customDates]);

  // 计算逻辑
  const stats = useMemo(() => {
    const todayObj = new Date();
    todayObj.setHours(0,0,0,0);
    const todayStr = toDateStr(todayObj); // 获取今天的字符串

    const startObj = parseDateStr(startDate);
    const endObj = parseDateStr(endDate);

    if (!startObj || !endObj) return null;

    const allSkipDates = new Set();
    HOLIDAYS.forEach(h => {
      if (selectedHolidays.includes(h.label)) {
        h.dates.forEach(d => allSkipDates.add(d));
      }
    });
    customDates.forEach(d => allSkipDates.add(d));

    let usedDays = 0;
    let remainDays = 0;
    
    const cursor = new Date(startObj);
    while (cursor <= endObj) {
      const cursorStr = toDateStr(cursor);
      
      if (!allSkipDates.has(cursorStr)) {
        if (cursor < todayObj) {
            usedDays++;
        } else {
            remainDays++;
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const usedMealVal = parseInt(totalMeal || 0) - parseInt(remainMeal || 0);
    const avgUsed = usedDays > 0 ? (usedMealVal / usedDays).toFixed(2) : '--';
    const avgRemain = remainDays > 0 ? (parseInt(remainMeal || 0) / remainDays).toFixed(2) : '--';
    const futureLeft = remainDays > 0 
      ? (parseInt(remainMeal || 0) - (usedDays > 0 ? (usedMealVal / usedDays) : 0) * remainDays).toFixed(1) 
      : '--';

    return { usedDays, remainDays, usedMeal: usedMealVal, avgUsed, avgRemain, futureLeft, todayStr };
  }, [startDate, endDate, totalMeal, remainMeal, selectedHolidays, customDates]);

  const toggleHoliday = (label) => {
    setSelectedHolidays(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const toggleCustomDate = (dateStr) => {
    setCustomDates(prev => 
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  const visibleHolidays = HOLIDAYS.filter(h => 
    h.dates.some(d => d >= startDate && d <= endDate)
  );

  return (
    <div className="container">
      <div className="card">
        <h2>Meal Swipe Planner™</h2>
        <div className="subtitle">Plan, predict, and optimize your semester meal swipes.</div>
        
        {/* 输入区域 */}
        <div className="input-group">
            <div className="input-row">
                <div className="input-field">
                    <label>Semester Start (YYYYMMDD)</label>
                    <input value={startDate} onChange={e => setStartDate(e.target.value)} maxLength={8} placeholder="20250824" />
                </div>
                <div className="input-field">
                    <label>Semester End (YYYYMMDD)</label>
                    <input value={endDate} onChange={e => setEndDate(e.target.value)} maxLength={8} placeholder="20251222" />
                </div>
            </div>
            <div className="input-row">
                <div className="input-field">
                    <label>Total Swipes</label>
                    <input value={totalMeal} onChange={e => setTotalMeal(e.target.value)} type="number" />
                </div>
                <div className="input-field">
                    <label>Swipes Left</label>
                    <input value={remainMeal} onChange={e => setRemainMeal(e.target.value)} type="number" />
                </div>
            </div>
            
            {/* 【恢复功能】显示 Today's Date */}
            <div style={{textAlign: 'right', color: '#888', fontSize: 13, marginTop: 5}}>
                Today: {stats ? stats.todayStr : toDateStr(new Date())}
            </div>
        </div>

        {/* 假期选择区域 */}
        {/* 【恢复功能】保留了原本的长文本提示 */}
        <div className="section-title" style={{display:'block', marginBottom: 15}}>
            <div style={{marginBottom: 10, color: '#333'}}>
                Select holidays you will NOT be on (eat on) campus:
            </div>
            {/* 这里的自定义按钮放在文字下方 */}
            <button className="btn btn-outline" style={{width: '100%', fontSize: 13, padding: 10}} onClick={() => setIsCalOpen(true)}>
                📅 Customized Holidays (Click to Open Calendar)
                {customDates.length > 0 && <span style={{marginLeft: 5, color: '#007aff'}}>• {customDates.length} days added</span>}
            </button>
        </div>

        <div className="holiday-list">
          {visibleHolidays.map(h => (
            <div 
                key={h.label} 
                className={`holiday-item ${selectedHolidays.includes(h.label) ? 'active' : ''}`}
                onClick={() => toggleHoliday(h.label)}
            >
              <div className="checkbox">✓</div>
              <div style={{fontSize: 14}}>
                  <div>{h.label}</div>
                  <div style={{fontSize: 10, color: '#888'}}>{h.dates.length} days</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 统计卡片区域 */}
      {stats && (
        <>
            <div className="summary-card">
                <h4>📊 Usage So Far</h4>
                <div className="stat-row"><span>Active Days Passed:</span> <span className="stat-val">{stats.usedDays}</span></div>
                <div className="stat-row"><span>Swipes Used:</span> <span className="stat-val">{stats.usedMeal}</span></div>
                <div className="stat-row"><span>Avg. Daily Usage:</span> <span className="stat-val">{stats.avgUsed}</span></div>
            </div>

            <div className="summary-card" style={{background: '#e6fffa', borderColor: 'rgba(52, 199, 89, 0.2)'}}>
                <h4 style={{color: '#00a345'}}>🚀 Remaining Plan</h4>
                <div className="stat-row"><span>Active Days Left:</span> <span className="stat-val">{stats.remainDays}</span></div>
                <div className="stat-row"><span>Swipes Left:</span> <span className="stat-val">{remainMeal}</span></div>
                <div style={{marginTop: 10, padding: 10, background: 'white', borderRadius: 8, textAlign: 'center'}}>
                    <div style={{fontSize: 12, color: '#666'}}>Recommended Limit</div>
                    <div style={{fontSize: 24, fontWeight: 'bold', color: '#00a345'}}>{stats.avgRemain} <span style={{fontSize: 14}}>swipes/day</span></div>
                </div>
            </div>

            <div className="summary-card" style={{background: '#fff0f0', borderColor: 'rgba(255, 59, 48, 0.2)'}}>
                <h4 style={{color: '#ff3b30'}}>🔮 Projection</h4>
                <div style={{fontSize: 14, lineHeight: 1.5}}>
                    {stats.futureLeft !== '--' && (
                         Number(stats.futureLeft) > 0 
                            ? <span>🎉 You will have <b style={{color: '#34c759'}}>{Math.abs(Number(stats.futureLeft))}</b> extra swipes.</span>
                            : <span>⚠️ You will be short by <b style={{color: '#ff3b30'}}>{Math.abs(Number(stats.futureLeft))}</b> swipes.</span>
                    )}
                </div>
            </div>
        </>
      )}

      <div style={{textAlign: 'center', fontSize: 12, color: '#ccc', marginTop: 30}}>
        © 2026 Tim Guan — Meal Swipe Planner™
      </div>

      <CalendarModal 
        isOpen={isCalOpen} 
        onClose={() => setIsCalOpen(false)}
        selectedDates={customDates}
        onToggleDate={toggleCustomDate}
        onClearAll={() => setCustomDates([])}
      />
    </div>
  );
}

export default App;