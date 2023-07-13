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


export function InvoiceDetails() {
	const { pk } = useParams();

	const [data, setData] = useState({ invoices: [] });

	useEffect(() => {
		axiosInstance.get({pk}).then((res) => {
			setData({ invoices: res.data });
			console.log(res.data);
		});
	}, [setData]);

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Dessert (100g serving)</TableCell>
            <TableCell align="right">Calories</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          
            <TableRow
              key={data.invoices.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="invoice">
                {data.invoices.number}
              </TableCell>
              <TableCell align="right">{data.invoices.amount}</TableCell>
            </TableRow>

        </TableBody>
      </Table>
    </TableContainer>
  );
}