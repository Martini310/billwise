import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { axiosInstance } from 'src/utils/axios';
import { Box, MenuItem, Popover, Typography } from '@mui/material';

export const NotificationPopover = (props) => {
  const { anchorEl, onClose, open } = props;

  const router = useRouter();
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    axiosInstance
      .get('accounts/')
      .then((res) => {
        setAccounts(res.data);
      });
  }, []);

  useEffect(() => {
    // This code will run only on the client side
    if (typeof window !== 'undefined') {
      const notificationIconClass = accounts.some((account) => account.notification) ? 'test' : '';
      const notificationIcon = window.document.getElementsByClassName('notification-icon')[0];
      if (notificationIcon && notificationIconClass) {
         notificationIcon.classList.add(notificationIconClass);
      }
    }
  }, [accounts]); // Run this effect whenever accounts change


  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{
        horizontal: 'left',
        vertical: 'bottom'
      }}
      onClose={onClose}
      open={open}
      PaperProps={{ sx: { width: 400, left: '65%', backgroundColor: '#ebf9ff'} }}
    >
      <Box
        sx={{
          py: 1.5,
          px: 2
        }}
      >
        <Typography
          color="inherit"
          variant="subtitle1"
        >
          Powiadomienia
        </Typography>

        {accounts.map((account) => (
          account.notification && 
            <MenuItem 
              key={account.id} 
              onClick={() => { router.push({ pathname: 'edit-account/', query: { accountId: account.id } }); onClose(); }}
              sx={{ backgroundColor: '#ffe8e8', marginLeft: '-16px', marginRight: '-16px' }}
            >
              <img
                src={'/assets/logos/logo-' + (account.supplier['name']).toLowerCase() + '.png'}
                style={{ width: 'auto', height: '20px', marginRight: '10px', marginLeft: '-10px' }}
                alt={account.supplier['name']}
              />
              <Typography
                color="textSecondary"
                variant="caption"
                noWrap
              >
                {account.notification}
              </Typography>
            </MenuItem>
        ))}

      </Box>
    </Popover>
  );
}

NotificationPopover.propTypes = {
  anchorEl: PropTypes.any,
  onClose: PropTypes.func,
  open: PropTypes.bool.isRequired
};