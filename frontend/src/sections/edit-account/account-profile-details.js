import { useCallback, useState, useEffect } from 'react';
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
import { axiosInstance } from 'src/utils/axios';
import { toast } from 'sonner'


export const AccountProfileDetails = (props) => {
  const { account, categories } = props;

  const router = useRouter()
  const [post, setPost] = useState();

  useEffect(() => {
    setPost(account);
  }, [account])
  
  const [showPassword, setShowPassword] = useState(false);
  
  const handleClickShowPassword = () => setShowPassword((show) => !show);
  
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };
  
  const handleChange = (event) => {
    setPost({...post, [event.target.name]: event.target.value});
  }
  
  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      delete post.supplier;
      delete post.last_sync;
      post.notification = '';
      if (typeof post.category === 'object') 
        (delete post.category); // if category not edited remove it from post request
      axiosInstance.patch(`accounts/${post.id}/`, post)
        .then((res) => {
          console.log(res);
          router.push("/accounts/");
          toast.success('Zapisano zmiany');
        })
        .catch((err) => console.log(err));
    }, [post]
  );

  const handleDelete = useCallback(
    (event) => {
      event.preventDefault();
      axiosInstance.delete(`accounts/${account.id}/`)
        .then((res) => {
          console.log(res);
          router.push("/accounts/");
          toast.success('Usunięto dostawcę');
        })
        .catch((err) => console.log(err));
    }, [account]
  );

  return (
    post &&
    <form
      autoComplete="off"
      noValidate
      onSubmit={handleSubmit}
    >
      <Card>
        <CardHeader
          subheader="Możesz je edytować"
          title={ "Dane Twojego konta w " + post.supplier['name']}
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
                  helperText="Podaj swój login"
                  label="Login"
                  name="login"
                  onChange={handleChange}
                  required
                  value={post.login}
                />
              </Grid>
              <Grid
                xs={12}
                md={6}
              >
                <TextField
                  fullWidth
                  label="Hasło"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  onChange={handleChange}
                  required
                  value={post.password}
                  InputProps={{
                    endAdornment: 
                      <InputAdornment position="end">
                        <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            edge="end"
                          >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>,
                  }}
                />
              </Grid>
              <Grid
                xs={12}
                md={6}
              >
                <TextField
                  fullWidth
                  label="eBOK"
                  name="ebok"
                  onChange={handleChange}
                  disabled
                  value={post.supplier['url']}
                />
              </Grid>
              <Grid
                xs={12}
                md={6}
              >
                <TextField
                  fullWidth
                  label="Kategoria"
                  name="category"
                  onChange={handleChange}
                  required
                  select
                  SelectProps={{ native: true }}
                  value={post.category.id}
                >
                  {categories.map((category) => (
                    <option
                      key={category.name}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'space-between' }}>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Usuń
          </Button>
          <Button variant="contained" type='submit'>
            Zapisz zmiany
          </Button>

        </CardActions>
      </Card>
    </form>
  );
};
