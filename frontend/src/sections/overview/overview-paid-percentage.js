import PropTypes from 'prop-types';
import ListBulletIcon from '@heroicons/react/24/solid/ListBulletIcon';
import ClipboardDocumentCheckIcon from '@heroicons/react/24/solid/ClipboardDocumentCheckIcon';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  SvgIcon,
  Typography
} from '@mui/material';

export const OverviewPaidPercentage = (props) => {
  const { value, sx } = props;

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
              gutterBottom
              variant="overline"
            >
              Opłacone faktury
            </Typography>
            <Typography variant="h4">
              {typeof value === 'number' ? value + '%' : value}
            </Typography>
          </Stack>
          <Avatar
            sx={{
              backgroundColor: 'success.main',
              height: 56,
              width: 56
            }}
          >
            <SvgIcon>
              <ClipboardDocumentCheckIcon />
            </SvgIcon>
          </Avatar>
        </Stack>
        <Box sx={{ mt: 3 }}>
          <LinearProgress
            value={typeof value === 'number' ? value : 0}
            variant="determinate"
          />
        </Box>
      </CardContent>
    </Card>
  );
};
// value can be either a number or an object
OverviewPaidPercentage.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  sx: PropTypes.object
};
