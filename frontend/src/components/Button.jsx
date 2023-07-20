import * as React from 'react';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import AddCircleIcon from '@mui/icons-material/AddCircle';


export default function AddButton() {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <IconButton aria-label="add" size="large" color='primary' href='/add-account'>
        <AddCircleIcon fontSize="inherit" />
      </IconButton>
    </Stack>
  );
}
