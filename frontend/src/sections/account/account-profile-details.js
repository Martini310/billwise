import { useCallback, useState, useEffect } from 'react';
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
import Cookies from 'js-cookie';


export const AccountProfileDetails = () => {

  const user_pk = Cookies.get('id');
  const [profileDetails, setProfileDetails] = useState();
  const [initialData, setInitialData] = useState();
  const patchURL = 'user/user-info/' + Cookies.get('id') + '/'
  const router = useRouter()

  
  // Fetch user info
  useEffect(() => {
      axiosInstance
        .get(`user/user-info/${user_pk}`)
        .then((res) => {
          delete res.data.id
          setInitialData(res.data);
          setProfileDetails(res.data);
          }
        )
  }, [setProfileDetails]);

  console.log(profileDetails)
  
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
      console.log(initialData)
      console.log(profileDetails)
      let updatedData = {...initialData, ...profileDetails}
      console.log(updatedData)
      axiosInstance.patch(patchURL, updatedData)
        .then((res) => {
          console.log(res);
          router.push("/");
        })
        .catch((err) => console.log(err));
    },
    [initialData, profileDetails]
  );

  return (
    profileDetails &&
    <form
      autoComplete="off"
      noValidate
      onSubmit={handleSubmit}
    >
      <Card>
        <CardHeader
          subheader="Możesz je edytować"
          title="Informacje profilowe"
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
                  name="user_name"
                  onChange={handleChange}
                  required
                  value={profileDetails.user_name}
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
