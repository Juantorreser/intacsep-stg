import React from 'react';
import { Autocomplete, TextField, Checkbox } from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const MultiSelect = ({ label, options, value, onChange }) => {
  return (
    <Autocomplete
      multiple
      size="small"
      options={options || []}
      disableCloseOnSelect
      value={value || []}
      onChange={(event, newValue) => onChange(newValue)}
      isOptionEqualToValue={(option, value) => option === value}
      getOptionLabel={(option) => option}
      renderOption={(props, option, { selected }) => (
        <li {...props}>
          <Checkbox
            icon={icon}
            checkedIcon={checkedIcon}
            style={{ marginRight: 8 }}
            checked={selected}
          />
          {option}
        </li>
      )}
      renderInput={(params) => (
        <TextField {...params} label={label} placeholder={label} variant="outlined" size="small" />
      )}
      sx={{ 
        width: 250,
        '& .MuiOutlinedInput-root': { borderRadius: '6px', backgroundColor: '#fff', fontSize: '0.8rem' },
        '& .MuiInputLabel-root': { fontSize: '0.8rem', top: '-5px' }
      }}
    />
  );
};

export default MultiSelect;
