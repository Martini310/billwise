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
  TextField,
  Unstable_Grid2 as Grid
} from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { axiosInstance } from 'src/utils/axios';


export const AccountProfileDetails = (props) => {
  const { account, categories } = props;

  const apiUrl = `http://127.0.0.1:8000/api/`;
  const router = useRouter()
  const [post, setPost] = useState();

  useEffect(() => {
    setPost(props.account);
    }, [props.account])
  console.log(post)
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleChange = (event) => {
    setPost({...post, [event.target.name]: event.target.value});
    console.log(post);
  }

  // const handleSelect = (event) => {
  //   setPost({...post, 'category': categories[event.target.value - 1]});
  //   console.log(post);
  // };

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const post_link = `${apiUrl}accounts/${post.id}/`;
      delete post.supplier
      console.log(post);
      axiosInstance.patch(post_link, post, { 'headers': { 'Authorization': 'JWT ' + localStorage.getItem('access_token'), }})
        .then((res) => {
          console.log(res);
          router.push("/companies/");
        })
        .catch((err) => console.log(err));
    }, [post]
  );

  const handleDelete = useCallback(
    (event) => {
      event.preventDefault();
      const link = `${apiUrl}accounts/${account.id}/`;
      axiosInstance.delete(link, { 'headers': { 'Authorization': 'JWT ' + localStorage.getItem('access_token'), }})
        .then((res) => {
          console.log(res);
          router.push("/companies/");
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
                  helperText="Please specify your login"
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
                  label="Password"
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
                  // value={3}
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
