import React from 'react';

const TimeRangePicker = ({ label, startValue, endValue, onStartChange, onEndChange }) => {
  return (
    <div className="d-flex align-items-center gap-2">
      <small className="text-muted fw-bold text-nowrap">{label}:</small>
      <input 
        type="time" 
        className="form-control form-control-sm border-0 shadow-sm" 
        value={startValue}
        onChange={(e) => onStartChange(e.target.value)}
      />
      <input 
        type="time" 
        className="form-control form-control-sm border-0 shadow-sm" 
        value={endValue}
        onChange={(e) => onEndChange(e.target.value)}
      />
    </div>
  );
};

export default TimeRangePicker;
