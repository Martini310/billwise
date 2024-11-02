import { useCallback, useState } from 'react';
import { axiosInstance } from 'src/utils/axios';
import {useRouter} from 'next/router';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  TextField,
  Unstable_Grid2 as Grid
} from '@mui/material';


export const ProfileDetails = (props) => {

  const { user } = props 

  const [profileDetails, setProfileDetails] = useState(user);
  const patchURL = `user/user-info/${user?.id}/`
  const router = useRouter()

  const handleChange = 
    (event) => {
      setProfileDetails((prevState) => ({
        ...prevState,
        [event.target.name]: event.target.value
      }));
    };

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      axiosInstance.patch(patchURL, profileDetails)
        .then((res) => {
          console.log(res);
          router.push("/");
          toast.success('Zapisano zmiany');
        })
        .catch((err) => console.log(err));
    },
    [profileDetails]
  );

  return (
    profileDetails &&
    <form
      autoComplete="off"
      onSubmit={handleSubmit}
    >
      <Card>
        <CardHeader
          title="Informacje profilowe"
          subheader="Możesz je edytować"
        />
        <CardContent sx={{ pt: 0 }}>
          <Box sx={{ m: -1.5 }}>
            <Grid
              container
              spacing={3}
            >
              <Grid
                xs={12}
                md={6}
              >
                <TextField
                  fullWidth
                  helperText="Please specify the first name"
                  label="Imię"
                  name="first_name"
                  onChange={handleChange}
                  required
                  value={profileDetails.first_name}
                />
              </Grid>
              <Grid
                xs={12}
                md={6}
              >
                <TextField
                  fullWidth
                  label="Nazwa użytkownika"
                  name="username"
                  onChange={handleChange}
                  required
                  value={profileDetails.username}
                />
              </Grid>
              <Grid
                xs={12}
                md={6}
              >
                <TextField
                  fullWidth
                  label="Adres Email"
                  name="email"
                  onChange={handleChange}
                  required
                  value={profileDetails.email}
                />
              </Grid>
              <Grid
                xs={12}
                md={6}
              >
                <TextField
                  fullWidth
                  label="O mnie"
                  name="about"
                  onChange={handleChange}
                  value={profileDetails.about}
                />
              </Grid>
            </Grid>
          </Box>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button variant="contained" type='submit'>
            Zapisz
          </Button>
        </CardActions>
      </Card>
    </form>
  );
};
