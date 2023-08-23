import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import PropTypes from 'prop-types';
import { Unstable_Grid2 as Grid } from '@mui/material';


const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 5
};

const verboseNames = {
  number: 'Numer faktury',
  date: 'Data faktury',
  amount: 'Kwota',
  pay_deadline: 'Termin',
  start_date: 'Data począrkowa',
  end_date: 'Data końcowa',
  amount_to_pay: 'Do zapłaty',
  wear: 'Zużycie',
  is_paid: 'Status',
  consumption_point: 'Miejsce poboru'
  // Add more key-verboseName pairs here
};

export const BasicModal = (props) => {
    const { open, onClose, order } = props;
  
    return (
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Text in a modal
          </Typography>
          <Grid
              container
              spacing={3}
          >
            {Object.entries(order).map(([key, value]) => {
              if (typeof value == 'object') {
                return null;
              }

              const verboseName = verboseNames[key] || key; // Use verbose name if available, otherwise use key
              const displayValue = typeof value === 'string' ? value : String(value);

              return (
                <React.Fragment key={key}>
                  <Grid
                    xs={12}
                    md={6}
                  >
                    <Typography id="modal-modal-key" sx={{ mt: 2 }}>
                        {verboseName}
                    </Typography>
                  </Grid>
                  <Grid
                    xs={12}
                    md={6}
                  >
                    <Typography id="modal-modal-value" sx={{ mt: 2 }}>
                        {displayValue}
                    </Typography>
                  </Grid>
                </React.Fragment>
              )
            })}
          </Grid>
        </Box>
      </Modal>
    );
  };
  
