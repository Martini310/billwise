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
              src=''
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
              jakiś tekst
            </Typography>
            <Typography
              color="text.secondary"
              variant="body2"
            >
              i coś jeszcze
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
