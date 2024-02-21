import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Divider, MenuItem, MenuList, Popover, Typography } from '@mui/material';
import { signOut, useSession } from 'next-auth/react';
import { toast } from 'sonner'


export const AccountPopover = (props) => {
  const { anchorEl, onClose, open } = props;
  const { data: session, status } = useSession()

  const handleSignOut = useCallback(
    () => {
      onClose?.();
      signOut({ callbackUrl: '/auth/login' })
      toast.success('Wylogowano prawidłowo!');
    },
    [onClose]
  );

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{
        horizontal: 'left',
        vertical: 'bottom'
      }}
      onClose={onClose}
      open={open}
      PaperProps={{ sx: { width: 200 } }}
    >
      <Box
        sx={{
          py: 1.5,
          px: 2
        }}
      >
        <Typography variant="overline">
          Konto
        </Typography>
        <Typography
          color="text.secondary"
          variant="body2"
        >
          {session?.user?.email}
        </Typography>
      </Box>
      <Divider />
      <MenuList
        disablePadding
        dense
        sx={{
          p: '8px',
          '& > *': {
            borderRadius: 1
          }
        }}
      >
        <MenuItem onClick={handleSignOut}>
          Wyloguj
        </MenuItem>
      </MenuList>
    </Popover>
  );
};

AccountPopover.propTypes = {
  anchorEl: PropTypes.any,
  onClose: PropTypes.func,
  open: PropTypes.bool.isRequired
};
