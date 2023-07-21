import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import BasicDatePicker from './datePicker';
import { FormControl } from '@mui/material';
import { useState } from 'react';
import Button from '@mui/joy/Button';
import dayjs from 'dayjs';
import { axiosInstance } from '../axios';
import { baseURL } from '../axios';
import { useNavigate } from 'react-router-dom';


export default function NewInvoice() {
    
    const user = localStorage.getItem('userID')
    const [post, setPost] = useState({
        number: '',
        amount: '',
        pay_deadline: '',
        date: '',
        start_date: '',
        end_date: '',
        wear: '',
        point: '',
        to_pay: '',
        user: user,
        is_paid: false,
        supplier: 1
    });

    const handleInput = (event) => {
        setPost({...post, [event.target.name]: event.target.value});
    }

    const handleDateChange = (name, dateValue) => {
        const formattedDate = dayjs(dateValue.target.value).format('YYYY-MM-DD');
        setPost({ ...post, [name]: formattedDate });
      };

    const navigate = useNavigate();
    const handleSubmit = (event) => {
        event.preventDefault();
        console.log(post);
        const post_link = baseURL + 'invoices/';
        axiosInstance.post(post_link, post)
            .then((res) => {
                console.log(res);
                // navigate('/');
            })
            .catch((err) => console.log(err));
      };

    return (
    <Box
        component="form"
        sx={{
        '& > :not(style)': { m: 1, width: '25ch' },
        }}
        noValidate
        autoComplete="off"
        onSubmit={handleSubmit}
    >
        <FormControl>
            <TextField name="number" label="Numer faktury" variant="outlined" onChange={handleInput}/>
            <TextField name="amount" label="Kwota" variant="filled" type="number" onChange={handleInput} InputLabelProps={{ shrink: true, }}/>
            <BasicDatePicker name="date" label="Data faktury" onChange={(dateValue) => handleDateChange('date', dateValue)}/>
            <BasicDatePicker name="pay_deadline" label="Data płatności" onChange={(dateValue) => handleDateChange('pay_deadline', dateValue)}/>
            <BasicDatePicker name="start_date" label="Początek okresu" onChange={(dateValue) => handleDateChange('start_date', dateValue)}/>
            <BasicDatePicker name="end_date" label="Koniec okresu" onChange={(dateValue) => handleDateChange('end_date', dateValue)}/>

            <TextField name="to_pay" label="Do zapłaty" variant="standard"  onChange={handleInput}/>
            <TextField name="point" label="Punkt poboru" variant="standard"  onChange={handleInput}/>
            <TextField name="wear" label="Zużycie" variant="standard" type="number" onChange={handleInput} InputLabelProps={{ shrink: true, }}/>
            <Button type="submit">Dodaj</Button>
        </FormControl>

    </Box>
    );
}