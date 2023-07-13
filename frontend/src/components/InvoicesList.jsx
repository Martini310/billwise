// import React from "react";
// export const InvoicesList = (props) => {
//   const { invoices } = props;
//   if (!invoices || invoices.length === 0) return <p>No invoices, sorry</p>;
//   return (
//     <ul>
//       <h2 className='list-head'>Available invoices</h2>
//         {invoices.map(invoice => (
//             <li key={invoice.id}>{invoice.number}
//                 <ul>
//                     <li>{invoice.supplier} | {invoice.date} | {invoice.amount}zł | {invoice.is_paid? 'Opłacone' : 'Nieopłacone'} </li>
//                 </ul>
            
//             </li>
//         ))}
//     </ul>
//   );
// };

// import * as React from 'react';
// import Table from '@mui/joy/Table';
// import Link from '@material-ui/core/Link';
// import { Navigate } from 'react-router-dom';
// import { TableRow, TableBody, TableCell } from '@material-ui/core';

// export const InvoicesList = (props) => {
//   const { invoices } = props;
//   if (!invoices || invoices.length === 0) return <p>No invoices, sorry</p>;

//   return (
//     <Table hoverRow sx={{ '& tr > *:not(:first-of-type)': { textAlign: 'left' } }}>
//       <thead>
//         <tr>
//           <th style={{ width: '40%', textAlign: 'center' }}>Wystawca</th>
//           <th>Nr Faktury</th>
//           <th>Data wystawienia</th>
//           <th>Kwota</th>
//           <th>Status</th>
//         </tr>
//       </thead>
//       <tbody>
//         <TableBody>
//       {invoices.map((invoice) => (
//           <TableRow>
//             <TableCell>{invoice.number}</TableCell>
//             <TableCell>{invoice.supplier}</TableCell>
//             <TableCell>{invoice.date}</TableCell>
//             <TableCell>{invoice.amount}</TableCell>
//             <TableCell>{invoice.is_paid? 'Opłacone' : 'Nieopłacone'}</TableCell>
//           </TableRow>
//         ))}
//         </TableBody>
//         {invoices.map((invoice) => (
//             <tr key={invoice.number}>
//               <td>{invoice.supplier}</td>
//               <td>{invoice.number}</td>
//               <td>{invoice.date}</td>
//               <td>{invoice.amount}</td>
//               <td>{invoice.is_paid? 'Opłacone' : 'Nieopłacone'}</td>
//             </tr>
//         ))}
//       </tbody>
//     </Table>
//   );
// }

import * as React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { useNavigate } from 'react-router-dom';

const columns = [
  { id: 'supplier', label: 'Wystawca', minWidth: 170 },
  { id: 'number', label: 'Nr faktury', minWidth: 100 },
  {
    id: 'date',
    label: 'Data faktury',
    minWidth: 170,
    align: 'right',
  },
  {
    id: 'amount',
    label: 'Kwota',
    minWidth: 170,
    align: 'right',
  },
  {
    id: 'is_paid',
    label: 'Status',
    minWidth: 170,
    align: 'right',
  },
];

export const InvoicesList = (props) => {
  const { invoices } = props;
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const navigate = useNavigate();
  if (!invoices || invoices.length === 0) return <p>No invoices, sorry</p>;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((invoice) => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={invoice.id} onClick={() => { navigate('api/invoices/' + invoice.id); }}>
                    {columns.map((column) => {
                      const value = invoice[column.id];
                      return (
                        <TableCell key={column.id} align={column.align}>
                        {value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={invoices.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}