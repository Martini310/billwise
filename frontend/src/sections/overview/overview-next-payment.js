import PropTypes from 'prop-types';
import CalendarDaysIcon from '@heroicons/react/24/solid/CalendarDaysIcon';
import { Avatar, Card, CardContent, Stack, SvgIcon, Typography } from '@mui/material';

export const OverviewNextPayment = (props) => {
  const { date, supplier, value, sx } = props;

  return (
    <Card sx={sx}>
      <CardContent>
        <Stack
          alignItems="flex-start"
          direction="row"
          justifyContent="space-between"
          spacing={0}
        >
          <Stack spacing={-1}>
            <Typography
              color="text.secondary"
              variant="overline"
            >
              Najbliższa płatność
            </Typography>
            <Typography variant="h5">
              {value}
            </Typography>
          </Stack>
          <Avatar
            sx={{
              backgroundColor: 'primary.main',
              height: 56,
              width: 56
            }}
          >
            <SvgIcon>
              <CalendarDaysIcon />
            </SvgIcon>
          </Avatar>
        </Stack>
        {supplier && (
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
            sx={{ mt: 1 }}
          >
            <Stack
              alignItems="center"
              direction="row"
              spacing={1}
            >
              <Typography
                color="text.secondary"
                variant="overline"
              >
                Wystawione przez 
              </Typography>
            </Stack>
            <Typography
              color="text.primary"
              variant="caption"
            >
              {supplier}
            </Typography>
          </Stack>
        )}
          {date && (
            <Stack
              alignItems="center"
              direction="row"
              spacing={1}
              sx={{ mt: -1 }}
            >
            <Stack
              alignItems="center"
              direction="row"
              spacing={1}
            >
              <Typography
                color="text.secondary"
                variant="overline"
              >
                Płatne do 
              </Typography>
            </Stack>
            <Typography
              color="text.primary"
              variant="caption"
            >
              {date}
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

OverviewNextPayment.propTypes = {
  date: PropTypes.string,
  supplier: PropTypes.string,
  value: PropTypes.string,
  sx: PropTypes.object
};
