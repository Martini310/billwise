import { useCallback, useState, useEffect } from 'react';
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

  const [categories, setCategories] = useState()
  const [suppliers, setSuppliers] = useState()
  const apiUrl = `http://127.0.0.1:8000/api/`;
  const [post, setPost] = useState({
    login: '',
    password: '',
    supplier: '',
    category: '',
    user: ''
  });

  // Fetch Categories and create array with category names
  useEffect(() => {
    axiosInstance.get(apiUrl + 'category/')
      .then((res) => {
        const categories = res.data;
        let categoryNames = [];
        categories.forEach((category) => 
          categoryNames.push(category.name))
        setCategories(categoryNames);
    });
  }, [setCategories, apiUrl]);

  useEffect(() => {
    axiosInstance.get(apiUrl + 'suppliers/')
      .then((res) => {
        const suppliers = res.data;
        setSuppliers(suppliers);
        console.log(suppliers)
    });
  }, [setSuppliers, apiUrl]);

  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleChange = (event) => {
      setPost({...post, [event.target.name]: event.target.value});
      console.log(post)
    };

  const handleInput = (event) => {
    setPost({...post, [event.target.name]: event.target.value});
    console.log(post);
  }

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const post_link = apiUrl + 'account/add/';
      console.log(post);
      axiosInstance.post(post_link, post, { 'headers': { 'Authorization': 'JWT ' + localStorage.getItem('access_token'), }})
        .then((res) => console.log(res))
        .catch((err) => console.log(err));
    }, [post]
  );

  return (
    suppliers, categories &&
    <form
      autoComplete="off"
      noValidate
      onSubmit={handleSubmit}
    >
      <Card>
        <CardHeader
          // subheader="Możesz je edytować"
          title="Dane Twojego konta w "
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
                  onChange={handleInput}
                  required
                  value={post.login || ''}
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
                  onChange={handleInput}
                  required
                  value={post.password || ''}
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
                  onChange={handleInput}
                  disabled
                  value=''
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
                  onChange={handleInput}
                  required
                  select
                  SelectProps={{ native: true }}
                  value={categories[0]}
                >
                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </TextField>
              </Grid>
              <Grid
                xs={12}
                md={6}
              >
                <TextField
                  fullWidth
                  label="Dostawca"
                  name="supplier"
                  onChange={handleInput}
                  required
                  select
                  SelectProps={{ native: true }}
                  value={suppliers[0]['name']}
                >
                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.name}
                      value={supplier.name}
                    >
                      {supplier.name}
                    </option>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'space-between' }}>
          <Button variant="contained" color="error">
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
