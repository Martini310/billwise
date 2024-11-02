import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  Typography
} from '@mui/material';

const user = {
  // avatar: '/assets/avatars/avatar-anika-visser.png',
  city: 'Los Angeles',
  country: 'USA',
  jobTitle: 'Senior Developer',
  name: 'Anika Visserer',
  timezone: 'GTM-7'
};


export const AccountProfile = (props) => {
  const { supplierName } = props;
  const imagePath = supplierName
    ? `/assets/logos/logo-${supplierName.toLowerCase()}.png`
    : `/assets/logos/logo-inne.png`;

  return (
      <Card>
        <CardContent>
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Avatar
              src={imagePath}
              variant="square"
              sx={{ width: 160, height: 100 }}
            />
            <Typography
              gutterBottom
              variant="h5"
            >
              Nowe konto
            </Typography>
            <Typography
              color="text.secondary"
              variant="body2"
            >
              {supplierName}
            </Typography>
            <Typography
              color="text.secondary"
              variant="body2"
            >
              eBOK
            </Typography>
          </Box>
        </CardContent>
        <Divider />
        <CardActions>
          <Button
            fullWidth
            variant="text"
          >
            Upload picture
          </Button>
        </CardActions>
      </Card>
    )};
