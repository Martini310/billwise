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
  const { account } = props;

  return (
    account &&
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
              src={ '/assets/logos/logo-' + (account.supplier['name']).toLowerCase() + '.png' }
              variant="square"
              sx={{ width: 160, height: 100 }}
            />
            <Typography
              gutterBottom
              variant="h5"
            >
              {account.supplier['name']}
            </Typography>
            {account.notification && 
              <Typography
                align="center"
                gutterBottom
                variant="h6"
                color="red"
                >
                  {account.notification}
            </Typography>}
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
