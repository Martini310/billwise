import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { Unstable_Grid2 as Grid } from '@mui/material';
import Divider from '@mui/material/Divider';


const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
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
  consumption_point: 'Miejsce poboru',
  bank_account_number: 'Numer konta',
  transfer_title: 'Tytuł przelewu'
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
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
            Szczegóły faktury
          </Typography>
          <Grid
              container
              spacing={1}
          >
            {Object.entries(order).map(([key, value]) => {
              if (typeof value == 'object') {
                return null;
              }

              const verboseName = verboseNames[key] || key; // Use verbose name if available, otherwise use key
              let displayValue = typeof value === 'string' ? value : String(value);
              
              // Assign verbose name to is_paid status instead of boolean
              if (verboseName === 'Status') {
                if (displayValue === 'true') {
                  displayValue = 'Zapłacone';
                } else {
                  displayValue = 'Niezapłacone';
                }
              };

              // Assign '---' if there is no value
              if (displayValue === '') {
                displayValue = '---';
              };

              if (verboseName === 'Kwota' || verboseName === 'Do zapłaty') {
                displayValue += 'zł'
              }

              return (
                <React.Fragment key={key}>
                  <Grid xs={12} md={6}>
                    <Typography variant='modalkey' id="modal-modal-key" sx={{ mt: 2 }}>
                        {verboseName}
                    </Typography>
                  </Grid>
                  <Grid xs={12} md={6}>
                    <Typography variant='modalvalue' id="modal-modal-value" sx={{ mt: 2 }}>
                        {displayValue}
                    </Typography>
                  </Grid>
                  <Grid xs={12} md={6}>
                    <Divider variant="fullWidth" sx={{ borderBottom: '1px solid lightgrey' }}/>
                  </Grid>
                  <Grid xs={12} md={6}>
                    <Divider variant="fullWidth" sx={{ borderBottom: '1px solid lightgrey' }}/>
                  </Grid>
                </React.Fragment>
              )
            })}
          </Grid>
        </Box>
      </Modal>
    );
  };
  
