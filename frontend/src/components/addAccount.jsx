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
		});
	}, []);

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

      <form
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
    
        {suppliers.length > 0 && (
          <Select color="info" placeholder="Wybierz dostawcę" size="lg" variant="outlined">
            {suppliers.map((supplier) => (
              <Option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </Option>
            ))};
          </Select>
        )}

        <Input
          placeholder="Adres e-mail"
          required
          sx={{ mb: 1, fontSize: 'var(--joy-fontSize-sm)' }}
        />
        <Input
          placeholder="Hasło"
          required
          sx={{ mb: 1, fontSize: 'var(--joy-fontSize-sm)' }}
        />

        <Button type="submit">Dodaj</Button>
      </form>
    </Box>
  );
}