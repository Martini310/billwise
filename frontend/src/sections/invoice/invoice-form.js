import { useCallback, useState, useEffect } from 'react';
import { axiosInstance } from 'src/utils/axios';
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
    amount_to_pay: 0,
    wear: 0,
    category: '',
    is_paid: false,
    consumption_point: '',
    bank_account_number: '',
    transfer_title: ''
  });

  const [categories, setCategories] = useState();

  const router = useRouter();
  
  useEffect(() => {
    axiosInstance
      .get('category/')
      .then((res) => {
        const categories = res.data;
        setCategories(categories);
    });
  }, [setCategories]);


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
      console.log(values);
      axiosInstance
        .post('invoices/', values)
        .then((res) => {
          console.log(res);
          router.push("/");
        })
        .catch((err) => console.log(err));
    }, [values]
  );

  return ( categories &&
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader
          title="Wypełnij pola"
          subheader="i zatwierdź"
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
              label="Kategoria"
              name="category"
              onChange={handleChange}
              select
              value={values.category}
            >
              {categories.map((category) => (
                <MenuItem
                  key={category.name}
                  value={parseInt(category.id)}
                >
                  {category.name}
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
            <TextField
              fullWidth
              label="Numer konta"
              name="bank_account_number"
              onChange={handleChange}
              value={values.bank_account_number}
            />
            <TextField
              fullWidth
              label="Tytuł przelewu"
              name="transfer_title"
              onChange={handleChange}
              value={values.transfer_title}
            />
          </Stack>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button variant="contained" type='submit'>
            Dodaj
          </Button>
        </CardActions>
      </Card>
    </form>
  );
};
