import * as React from 'react';
import { useEffect, useState } from 'react';
import { axiosInstance } from '../axios';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Input from '@mui/joy/Input';
import { baseURL } from '../axios';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';


export function AddAccount() {

  const suppliers_link = baseURL + 'suppliers/';
  const currentUserLink = baseURL + 'current-user/';
  const [suppliers, setSuppliers] = useState( [] );
  const [user, setUser] = useState('');
  const [post, setPost] = useState({
    login: '',
    password: '',
    supplier: '',
    user: ''
  });

  const handleInput = (event) => {
    setPost({...post, [event.target.name]: event.target.value});
  }

  const handleSelect = (event) => {
    setPost({...post, 'supplier': event.target.value});
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const post_link = baseURL + 'account/add/';
    console.log(post);
    axiosInstance.post(post_link, post)
      .then((res) => console.log(res))
      .catch((err) => console.log(err));
  };

	useEffect(() => {
		axiosInstance.get(suppliers_link).then((res) => {
      const data = res.data;
			setSuppliers( data );
		});
	}, [suppliers_link]);

  useEffect(() => {
    axiosInstance.get(currentUserLink).then((res) => {
      const data = res.data;
			setUser( data );
      console.log(data);
      setPost({...post, 'user': data.id});
		});
	}, [currentUserLink, post]);


  return (
    <Box
      sx={{
        py: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      User: {user.id}
      <form onSubmit={handleSubmit}>
      <FormControl>
        <TextField
          id="outlined-select-currency"
          select
          label="Dostawca"
          name='supplier'
          defaultValue=''
          helperText="Wybierz dostawcę"
          onChange={handleSelect}
        >
          {suppliers.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.name}
            </MenuItem>
          ))}
        </TextField>

        <Input
          key='login'
          name='login'
          onChange={handleInput}
          placeholder="Login"
          required
          sx={{ mb: 1, fontSize: 'var(--joy-fontSize-sm)' }}
        />
        <Input
          key='password'
          name='password'
          onChange={handleInput}
          placeholder="Hasło"
          required
          sx={{ mb: 1, fontSize: 'var(--joy-fontSize-sm)' }}
        />
  
        <Button type="submit">Dodaj</Button>
      </FormControl>
      </form>

    </Box>
  );
  
}