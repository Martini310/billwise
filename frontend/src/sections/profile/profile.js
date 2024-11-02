import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  Skeleton,
  Typography
} from '@mui/material';


const avatar = '/assets/avatars/avatar-anika-visser.png'

export const Profile = (props) => {
  const { isLoading, user } = props;
  
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
          { isLoading 
            ? <Skeleton variant='circular' width={80} height={80} /> 
            : <Avatar
                src={ avatar }
                sx={{
                  height: 80,
                  mb: 2,
                  width: 80
                }}
              />
            }
          <Typography
            gutterBottom
            variant="h5"
          >
            { isLoading ? <Skeleton width={100}/> : user.username }
          </Typography>
          <Typography
            color="text.secondary"
            variant="body2"
          >
            { isLoading ? <Skeleton width={100}/> : user.first_name }
          </Typography>
          <Typography
            color="text.secondary"
            variant="body2"
          >
            { isLoading ? <Skeleton width={100}/> : user.about }
          </Typography>
        </Box>
      </CardContent>
      <Divider />
      <CardActions>
        <Button
          fullWidth
          variant="text"
          disabled
        >
          Upload picture
        </Button>
      </CardActions>
    </Card>
  );
}
