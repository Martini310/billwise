import PropTypes from 'prop-types';
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';

// Szybki przełącznik widoku: Wszystkie / <grupa> / Bez grupy. Ukryty, gdy nie ma grup.
export const OverviewGroupFilter = ({ groups, hasUngrouped, value, onChange }) => {
  if (!groups || groups.length === 0) {
    return null;
  }

  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      onChange={(event, next) => { if (next !== null) onChange(next); }}
      sx={{ flexWrap: 'wrap', bgcolor: 'background.paper' }}
    >
      <ToggleButton value="all" sx={{ textTransform: 'none', px: 2 }}>
        Wszystkie
      </ToggleButton>
      {groups.map((group) => (
        <ToggleButton key={group.id} value={group.id} sx={{ textTransform: 'none', px: 2 }}>
          <Box
            component="span"
            sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: group.color, mr: 1 }}
          />
          {group.name}
        </ToggleButton>
      ))}
      {hasUngrouped && (
        <ToggleButton value="none" sx={{ textTransform: 'none', px: 2 }}>
          Bez grupy
        </ToggleButton>
      )}
    </ToggleButtonGroup>
  );
};

OverviewGroupFilter.propTypes = {
  groups: PropTypes.array,
  hasUngrouped: PropTypes.bool,
  value: PropTypes.any,
  onChange: PropTypes.func
};
