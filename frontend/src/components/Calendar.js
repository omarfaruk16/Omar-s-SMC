import React from 'react';

const getMonthMatrix = (year, month) => {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7)); // Monday-first grid
  const matrix = [];
  let cur = new Date(start);
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    matrix.push(week);
  }
  return matrix;
};

const Calendar = ({ year, month, renderDay, header, onPrev, onNext, onDayClick }) => {
  const matrix = getMonthMatrix(year, month);
  const weekDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between p-3 border-b">
        <button onClick={onPrev} className="px-2 py-1 rounded bg-gray-100">◀</button>
        <div className="font-semibold">{header}</div>
        <button onClick={onNext} className="px-2 py-1 rounded bg-gray-100">▶</button>
      </div>
      <div className="grid grid-cols-7 text-xs font-semibold text-gray-500 border-b">
        {weekDays.map(w => <div key={w} className="p-2 text-center">{w}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {matrix.flat().map((date, idx) => (
          <button key={idx} type="button" onClick={()=>onDayClick && onDayClick(date)} className="text-left p-2 min-h-[64px] border-t border-l last:border-r w-full focus:outline-none focus:ring-2 focus:ring-blue-300">
            {renderDay(date)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
