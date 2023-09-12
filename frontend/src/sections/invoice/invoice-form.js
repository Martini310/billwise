import { useCallback, useState, useEffect } from 'react';
import { axiosInstance, baseURL } from 'src/utils/axios';
import {useRouter} from 'next/router';
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
    start_date: undefined,
    end_date: undefined,
    amount_to_pay: 0,
    wear: undefined,
    supplier: '',
    user: localStorage.getItem('id'),
    is_paid: false,
    consumption_point: '',
  });

  const [suppliers, setSuppliers] = useState();

  const router = useRouter();
  
  useEffect(() => {
    axiosInstance.get(baseURL + 'suppliers/')
      .then((res) => {
        const suppliers = res.data;
        setSuppliers(suppliers);
    });
  }, [setSuppliers, baseURL]);

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
      const post_link = baseURL + 'invoices/';
      console.log(values);
      axiosInstance
        .post(post_link, values, { 'headers': { 'Authorization': 'JWT ' + localStorage.getItem('access_token'), }})
        .then((res) => {
          console.log(res);
          router.push("/");
        })
        .catch((err) => console.log(err));
    }, [values]
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
            spacing={1}
            sx={{ maxWidth: 400 }}
          >
            <TextField
              fullWidth
              required
              label="Numer faktury"
              name="number"
              onChange={handleChange}
              value={values.number}
            />
            <TextField
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              label="Data faktury"
              name="date"
              onChange={handleChange}
              type="date"
              value={values.date}
            />
            <TextField
              fullWidth
              required
              label="Kwota"
              name="amount"
              onChange={handleChange}
              type="number"
              value={values.amount}
            />
            <TextField
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              label="Termin płatności"
              name="pay_deadline"
              onChange={handleChange}
              type="date"
              value={values.pay_deadline}
            />
            <TextField
              fullWidth
              InputLabelProps={{ shrink: true }}
              label="Data początkowa"
              name="start_date"
              onChange={handleChange}
              type="date"
              value={values.start_date}
            />
            <TextField
              fullWidth
              InputLabelProps={{ shrink: true }}
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
              required
              label="Dostawca"
              name="supplier"
              onChange={handleChange}
              select
              value={values.supplier}
            >
              {suppliers.map((supplier) => (
                <MenuItem
                  key={supplier.name}
                  value={parseInt(supplier.id)}
                >
                  {supplier.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              required
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
              name="consumption_point"
              onChange={handleChange}
              value={values.consumption_point}
            />
          </Stack>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button variant="contained" type='submit'>
            Update
          </Button>
        </CardActions>
      </Card>
    </form>
  );
};
