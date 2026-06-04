import React from 'react';
import { Box, TextField } from '@mui/material';

/**
 * Modern DateTimeRangePicker using MUI components.
 */
const DateTimeRangePicker = ({ label, startValue, endValue, onStartChange, onEndChange }) => {
  return (
    <Box className="d-flex align-items-center gap-2">
      <small className="text-muted fw-bold text-nowrap">{label}:</small>
      <TextField
        type="datetime-local"
        size="small"
        value={startValue}
        onChange={(e) => onStartChange(e.target.value)}
        sx={{ 
          '& .MuiOutlinedInput-root': { borderRadius: '6px', backgroundColor: '#fff', fontSize: '0.8rem' },
          '& .MuiOutlinedInput-input': { padding: '8px 10px' }
        }}
      />
      <TextField
        type="datetime-local"
        size="small"
        value={endValue}
        onChange={(e) => onEndChange(e.target.value)}
        sx={{ 
          '& .MuiOutlinedInput-root': { borderRadius: '6px', backgroundColor: '#fff', fontSize: '0.8rem' },
          '& .MuiOutlinedInput-input': { padding: '8px 10px' }
        }}
      />
    </Box>
  );
};

export default DateTimeRangePicker;
