import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import BasicDatePicker from './datePicker';
import { FormControl } from '@mui/material';
import { useState } from 'react';
import Button from '@mui/joy/Button';


export default function NewInvoice() {

    // const [user, setUser] = useState('');
    const [post, setPost] = useState({
        number: '',
        amount: '',
        pay_deadline: '',
        user: 1
    });

    const handleInput = (event) => {
        setPost({...post, [event.target.name]: event.target.value});
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log(post);
      };

    return (
    <Box
        component="form"
        sx={{
        '& > :not(style)': { m: 1, width: '25ch' },
        }}
        noValidate
        autoComplete="off"
    >
        <form action=""  onSubmit={handleSubmit}>
        <FormControl onSubmit={handleSubmit}>
            <TextField id="number" name="number" label="Numer faktury" variant="outlined" onChange={handleInput}/>
            <TextField id="amount" name="amount" label="Kwota" variant="filled" type="number" onChange={handleInput} InputLabelProps={{ shrink: true, }}/>
            <BasicDatePicker name="date" label="Data faktury" onChange={handleInput}/>
            <BasicDatePicker label="Data płatności" />
            <BasicDatePicker label="Początek okresu"/>
            <BasicDatePicker label="Koniec okresu"/>

            <TextField id="to-pay" label="Do zapłaty" variant="standard" />
            <TextField id="wear" label="Zużycie" variant="standard" />
            <TextField id="point" label="Punkt poboru" variant="standard" />
            <TextField id="wear" label="Zużycie" variant="standard" type="number" InputLabelProps={{ shrink: true, }}/>
            <Button type="submit">Dodaj</Button>
        </FormControl>
        </form>
    </Box>
    );
}