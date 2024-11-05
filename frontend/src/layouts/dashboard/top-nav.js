import PropTypes from 'prop-types';
import BellIcon from '@heroicons/react/24/solid/BellIcon';
import UsersIcon from '@heroicons/react/24/solid/UsersIcon';
import Bars3Icon from '@heroicons/react/24/solid/Bars3Icon';
import RouteIcon from '@mui/icons-material/Route';
import MagnifyingGlassIcon from '@heroicons/react/24/solid/MagnifyingGlassIcon';
import {
  Avatar,
  Badge,
  Box,
  IconButton,
  Stack,
  SvgIcon,
  Tooltip,
  useMediaQuery
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { usePopover } from 'src/hooks/use-popover';
import { AccountPopover } from './account-popover';
import { NotificationPopover } from './notification-popover';
import { deepPurple } from '@mui/material/colors';
import { driverObj } from 'src/utils/animated-tour';

const SIDE_NAV_WIDTH = 280;
const TOP_NAV_HEIGHT = 64;

export const TopNav = (props) => {
  const { onNavOpen } = props;
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  const accountPopover = usePopover();
  const notificationPopover = usePopover();

  return (
    <>
      <Box
        component="header"
        sx={{
          backdropFilter: 'blur(6px)',
          backgroundColor: (theme) => alpha(theme.palette.background.default, 0.8),
          position: 'sticky',
          left: {
            lg: `${SIDE_NAV_WIDTH}px`
          },
          top: 0,
          width: {
            lg: `calc(100% - ${SIDE_NAV_WIDTH}px)`
          },
          zIndex: (theme) => theme.zIndex.appBar
        }}
      >
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          spacing={2}
          sx={{
            minHeight: TOP_NAV_HEIGHT,
            px: 2
          }}
        >
          <Stack
            alignItems="center"
            direction="row"
            spacing={2}
          >
            {!lgUp && (
              <IconButton onClick={onNavOpen}>
                <SvgIcon fontSize="small">
                  <Bars3Icon />
                </SvgIcon>
              </IconButton>
            )}
            <Tooltip title="Search">
              <IconButton>
                <SvgIcon fontSize="small">
                  <MagnifyingGlassIcon />
                </SvgIcon>
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack
            alignItems="center"
            direction="row"
            spacing={2}
          >
            <Tooltip title="Przewodnik" className='animated-tour'>
              <IconButton onClick={ () => driverObj.drive() } >
                <SvgIcon fontSize="small">
                  <RouteIcon />
                </SvgIcon>
              </IconButton>
            </Tooltip>
            <Tooltip title="Powiadomienia">
              <IconButton
                onClick={ notificationPopover.handleOpen }
                ref={ notificationPopover.anchorRef }
                className='notification-icon'
              >
                <SvgIcon fontSize="small">
                  <BellIcon />
                </SvgIcon>
              </IconButton>
            </Tooltip>
            <Avatar
              onClick={accountPopover.handleOpen}
              ref={accountPopover.anchorRef}
              // sx={{
              //   cursor: 'pointer',
              //   height: 40,
              //   width: 40
              // }}
              sx={{ cursor: 'pointer', bgcolor: deepPurple[500], marginLeft: '16px !important' }}
              // src="/assets/avatars/avatar-anika-visser.png"
            >
              
            </Avatar>
          </Stack>
        </Stack>
      </Box>
      <AccountPopover
        anchorEl={accountPopover.anchorRef.current}
        open={accountPopover.open}
        onClose={accountPopover.handleClose}
      />
      <NotificationPopover
        anchorEl={notificationPopover.anchorRef.current}
        open={notificationPopover.open}
        onClose={notificationPopover.handleClose}
      />
    </>
  );
};

TopNav.propTypes = {
  onNavOpen: PropTypes.func
};
