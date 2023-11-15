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
  IconButton,
  InputAdornment,
  TextField,
  Unstable_Grid2 as Grid
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';


export const ProfilePassword = () => {

  const router = useRouter()
  const [passwords, setPasswords] = useState({
    'old_password': '',
    'new_password': '',
    'confirm-password': '',
  });

  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [wrongOldPassword, setWrongOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleChange = 
    (event) => {
      setPasswords((prevState) => ({
        ...prevState,
        [event.target.name]: event.target.value
      }));

      // Reset error states
      setPasswordsMatch(true);
      setWrongOldPassword(false);
    };

  const comparePasswords = () => {
    const newPassword = passwords['new_password'];
    const confirmPassword = passwords['confirm-password'];
    return newPassword === confirmPassword;
  };

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      console.log(passwords)
      console.log(comparePasswords())
      if (comparePasswords()) {
        axiosInstance
          .post('user/change_password/', passwords)
          .then((res) => {
            console.log(res);
            router.push("/");
          })
          .catch((err) => {
            err.response.data.error === "Incorrect old password."
              ? setWrongOldPassword(true)
              : console.log(err);
            })
      } else {
        setPasswordsMatch(false);
      }
    }, [passwords]);

  return (
    <form
      autoComplete="off"
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
                  error={wrongOldPassword}
                  helperText={wrongOldPassword ? 'Niepoprawne hasło' : ''}
                  type={showPassword ? 'text' : 'password'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle old password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
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
                  type={showPassword ? 'text' : 'password'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle new password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
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
                  error={!passwordsMatch}
                  helperText={!passwordsMatch ? 'Hasła nie pasują do siebie' : ''}
                  type={showPassword ? 'text' : 'password'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
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
