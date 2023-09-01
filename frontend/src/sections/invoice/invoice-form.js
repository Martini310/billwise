import { useCallback, useState, useEffect } from 'react';
import { axiosInstance } from 'src/utils/axios';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  TextField,
  MenuItem
} from '@mui/material';

export const InvoiceForm = () => {
  const [values, setValues] = useState({
    number: '',
    date: '',
    amount: 0,
    pay_deadline: '',
    start_date: '',
    end_date: '',
    amount_to_pay: 0,
    wear: '',
    supplier: '',
    user: localStorage.getItem('id'),
    is_paid: false,
    consumption_point: '',
    account: '',
  });
  
  const [suppliers, setSuppliers] = useState()
  const apiUrl = `http://127.0.0.1:8000/api/`;
  
  useEffect(() => {
    axiosInstance.get(apiUrl + 'suppliers/')
      .then((res) => {
        const suppliers = res.data;
        setSuppliers(suppliers);
        console.log(suppliers)
    });
  }, [setSuppliers, apiUrl]);

  const handleChange = useCallback(
    (event) => {
      setValues((prevState) => ({
        ...prevState,
        [event.target.name]: event.target.value
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
    },
    []
  );

  return ( suppliers &&
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader
          subheader="i zatwierdź"
          title="Wypełnij pola"
        />
        <Divider />
        <CardContent>
          <Stack
            spacing={3}
            sx={{ maxWidth: 400 }}
          >
            <TextField
              fullWidth
              label="Numer faktury"
              name="number"
              onChange={handleChange}
              value={values.number}
            />
            <TextField
              fullWidth
              label="Data faktury"
              name="date"
              onChange={handleChange}
              type="date"
              value={values.date}
            />
            <TextField
              fullWidth
              label="Kwota"
              name="amount"
              onChange={handleChange}
              type="number"
              value={values.amount}
            />
            <TextField
              fullWidth
              label="Termin płatności"
              name="pay_deadline"
              onChange={handleChange}
              type="date"
              value={values.pay_deadline}
            />
            <TextField
              fullWidth
              label="Data początkowa"
              name="start_date"
              onChange={handleChange}
              type="date"
              value={values.start_date}
            />
            <TextField
              fullWidth
              label="Data końcowa"
              name="end_date"
              onChange={handleChange}
              type="date"
              value={values.end_date}
            />
            <TextField
              fullWidth
              label="Do zapłaty"
              name="amount_to_pay"
              onChange={handleChange}
              type="number"
              value={values.amount_to_pay}
            />
            <TextField
              fullWidth
              label="Zużycie"
              name="wear"
              onChange={handleChange}
              type="number"
              value={values.wear}
            />
            <TextField
              fullWidth
              label="Dostawca"
              name="supplier"
              onChange={handleChange}
              select
              value={values.supplier}
            >
              <MenuItem
                key='Inne'
                value='Inne'
              >
                Inne
              </MenuItem>
              {suppliers.map((supplier) => (
                <MenuItem
                  key={supplier.name}
                  value={supplier.id}
                >
                  {supplier.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Status"
              name="is_paid"
              onChange={handleChange}
              select
              value={values.is_paid}
            >
              <MenuItem key='zapłacone' value={true}>
              Zapłacone
              </MenuItem>
              <MenuItem key='niezapłacone' value={false}>
              Niezapłacone
              </MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Punkt poboru"
              name="consumtion_point"
              onChange={handleChange}
              value={values.consumption_point}
            />
          </Stack>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button variant="contained">
            Update
          </Button>
        </CardActions>
      </Card>
    </form>
  );
};
