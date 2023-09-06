import { useCallback, useState, useEffect } from 'react';
import { axiosInstance, baseURL } from 'src/utils/axios';
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


export const AccountProfilePassword = () => {

  const patchURL = baseURL + 'user/user-info/' + localStorage.getItem('id') + '/'
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
    });

  return (
    <form
      autoComplete="off"
      noValidate
      onSubmit={handleSubmit}
    >
      <Card>
        <CardHeader
          subheader="Możesz ustawić nowe"
          title="Hasło do konta"
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
                  label="Stare hasło"
                  name="old-password"
                  onChange={handleChange}
                  required
                  value=''
                />
              </Grid>
              <Grid
                xs={12}
                md={6}
              >
                <TextField
                  fullWidth
                  label="Nowe hasło"
                  name="password"
                  onChange={handleChange}
                  required
                  value=''
                />
              </Grid>
              <Grid
                xs={12}
                md={6}
              >
                <TextField
                  fullWidth
                  label="Potwierdź nowe hasło"
                  name="confirm-password"
                  onChange={handleChange}
                  required
                  value=''
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
