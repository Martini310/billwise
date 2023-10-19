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


export const AccountProfilePassword = () => {

  const router = useRouter()
  const [passwords, setPasswords] = useState({'old_password': '', 'new_password': ''})

  const handleChange = 
    (event) => {
      setPasswords((prevState) => ({
        ...prevState,
        [event.target.name]: event.target.value
      }));
    };

  const comparePasswords = (event) => {
    console.log(event.target.value === passwords['new_password'])
    return event.target.value === passwords['new_password']
  }

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (comparePasswords) {
        axiosInstance
          .post('user/change_password/', passwords)
          .then((res) => {
            console.log(res);
            router.push("/");
          })
          .catch((err) => console.log(err));
      }
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
                  name="old_password"
                  onChange={handleChange}
                  required
                  value={passwords['old_password']}
                />
              </Grid>
              <Grid
                xs={12}
                md={6}
              >
                <TextField
                  fullWidth
                  label="Nowe hasło"
                  name="new_password"
                  onChange={handleChange}
                  required
                  value={passwords['new_password']}
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
                  onChange={comparePasswords}
                  required
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
