import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from 'axios';
import { baseURL } from '../axios';


export function InvoiceDetails() {
	const { pk } = useParams();

	const [data, setData] = useState({ invoices: [] });
    const link = baseURL + 'invoices/' + pk

	useEffect(() => {
		axiosInstance.get(link).then((res) => {
			setData({ invoices: res.data });
			console.log(res.data);
		});
	}, [setData]);

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Numer faktury</TableCell>
            <TableCell align="right">{ data.invoices.number }</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          
            <TableRow
              key={data.invoices.amount}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="invoice">
                Kwota
              </TableCell>
              <TableCell align="right">{data.invoices.amount}</TableCell>
            </TableRow>

            <TableRow
              key={data.invoices.date}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="invoice">
                Data
              </TableCell>
              <TableCell align="right">{data.invoices.date}</TableCell>
            </TableRow>

        </TableBody>
      </Table>
    </TableContainer>
  );
}