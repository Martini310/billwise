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
import Cookies from 'js-cookie';
import axios from 'axios';


export const AccountProfileDetails = (props) => {

  const [categories, setCategories] = useState()
  const [suppliers, setSuppliers] = useState()
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter()

  const [post, setPost] = useState({
    login: '',
    password: '',
    supplier: '',
    category: '',
    user: Cookies.get('id')
  });

  // Fetch Categories and create array with category names
  useEffect(() => {
    axios.all([
      axiosInstance.get('category/'),
      axiosInstance.get('suppliers/'),
    ])
    .then(axios.spread((categoryResponse, suppliersResponse) => {
      setCategories(categoryResponse.data);
      setSuppliers(suppliersResponse.data);
    }))
  }, [setCategories, setSuppliers]
  )

  const handleClickShowPassword = () => {
    setShowPassword((show) => !show);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleSelect = (event) => {
    setPost({...post, 'supplier': event.target.value});
  };

  const handleInput = (event) => {
    setPost({...post, [event.target.name]: event.target.value});
  };

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      console.log(post);
      axiosInstance.post('accounts/', post)
        .then((res) => {
          console.log(res);
          router.push("/accounts/");
        })
        .catch((err) => console.log(err));
    }, [post]
  );

  return (
    (suppliers && categories) &&
    <form
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
                  onChange={handleInput}
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
                  value={post.category}
                >
                    <option
                      key='blank'
                      value=''
                    />
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
              <Grid
                xs={12}
                md={6}
              >
                <TextField
                  fullWidth
                  label="Dostawca"
                  name="supplier"
                  onChange={handleSelect}
                  required
                  select
                  SelectProps={{ native: true }}
                  value={post.supplier}
                >
                  <option
                      key='blank'
                      value=''
                    />
                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.name}
                      value={supplier.id}
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
          <Button variant="contained" type='submit'>
            Zapisz zmiany
          </Button>
        </CardActions>
      </Card>
    </form>
  );
};
