import * as React from 'react';
import { useEffect, useState } from 'react';
import { axiosInstance } from '../axios';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Input from '@mui/joy/Input';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import { baseURL } from '../axios';


export function AddAccount() {
    const [suppliers, setSuppliers] = useState( [] );
    const suppliers_link = baseURL + 'suppliers/';

	useEffect(() => {
		axiosInstance.get(suppliers_link).then((res) => {
      const data = res.data;
			setSuppliers( data );
      data.map((sup) => {
        console.log(sup)
        console.log(sup.name)
        console.log(sup.id)
      });
		});
	}, []);


  const [email, setEmail] = useState('');

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  
  const [password, setPassword] = useState('');

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };
  

  const [selectedSupplier, setSelectedSupplier] = useState('Enea');

  // const handleSupplierChange = (event) => {
  //   setSelectedSupplier(event.target.value);
  // };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log(email);
    console.log(password);
    console.log(selectedSupplier);
  };

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

      <form onSubmit={handleSubmit}>
    
        {suppliers.length > 0 && (
          <Select 
            value={selectedSupplier}
            onChange={e => {
              console.log(e.target.attributes);
              setSelectedSupplier(e)}}
            
            color="info" 
            placeholder="Wybierz dostawcę" 
            size="lg" 
            variant="outlined"
            >
            {suppliers.map((supplier, index) => (
              <Option key={index} value={supplier.name}>
                {supplier.name}
              </Option>
            ))};
          </Select>
        )}

        <Input
          type="email" 
          id="email" 
          value={email}
          onChange={handleEmailChange}
          placeholder="Adres e-mail"
          required
          sx={{ mb: 1, fontSize: 'var(--joy-fontSize-sm)' }}
        />
        <Input
          name='password'
          id="password" 
          value={password}
          onChange={handlePasswordChange}
          placeholder="Hasło"
          required
          sx={{ mb: 1, fontSize: 'var(--joy-fontSize-sm)' }}
        />

        <Button type="submit">Dodaj</Button>
      </form>
    </Box>
  );
}