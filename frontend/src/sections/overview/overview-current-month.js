import PropTypes from 'prop-types';
import ArrowDownIcon from '@heroicons/react/24/solid/ArrowDownIcon';
import ArrowUpIcon from '@heroicons/react/24/solid/ArrowUpIcon';
import CreditCardIcon from '@heroicons/react/24/solid/CreditCardIcon';
import { Avatar, Card, CardContent, Stack, SvgIcon, Typography } from '@mui/material';

export const OverviewCurrentMonth = (props) => {
  const { difference, positive = false, sx, value } = props;

  return (
    <Card sx={sx}>
      <CardContent>
        <Stack
          alignItems="flex-start"
          direction="row"
          justifyContent="space-between"
          spacing={3}
        >
          <Stack spacing={1}>
            <Typography
              color="text.secondary"
              variant="overline"
            >
              płatności w tym miesiącu
            </Typography>
            <Typography variant="h4">
              {value === 'NaNzł' ? 'Brak' : value}
            </Typography>
          </Stack>
          <Avatar
            sx={{
              backgroundColor: 'warning.main',
              height: 56,
              width: 56
            }}
          >
            <SvgIcon>
              <CreditCardIcon />
            </SvgIcon>
          </Avatar>

        </Stack>
        {value === 'NaNzł' ? '---' : (
          difference && (
            <Stack
              alignItems="center"
              direction="row"
              spacing={2}
              sx={{ mt: 2 }}
            >
              <Stack
                alignItems="center"
                direction="row"
                spacing={0.5}
              >
                <SvgIcon
                  color={positive ? 'error' : 'success'}
                  fontSize="small"
                >
                  {positive ? <ArrowUpIcon /> : <ArrowDownIcon />}
                </SvgIcon>
                <Typography
                  color={positive ? 'error.main' : 'success.main'}
                  variant="body2"
                >
                  {difference}%
                </Typography>
              </Stack>
              <Typography
                color="text.secondary"
                variant="caption"
              >
                od poprz. miesiąca
              </Typography>
            </Stack>
          ))}
      </CardContent>
    </Card>
  );
};

OverviewCurrentMonth.propTypes = {
  difference: PropTypes.number,
  positive: PropTypes.bool,
  value: PropTypes.string.isRequired,
  sx: PropTypes.object
};

