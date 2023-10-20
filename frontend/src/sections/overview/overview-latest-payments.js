// import PropTypes from 'prop-types';
// import ArrowRightIcon from '@heroicons/react/24/solid/ArrowRightIcon';
// import {
//   Box,
//   Button,
//   Card,
//   CardActions,
//   CardHeader,
//   Divider,
//   SvgIcon,
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableRow,
// } from '@mui/material';
// import { Scrollbar } from 'src/components/scrollbar';
// import { SeverityPill } from 'src/components/severity-pill';
// import TablePagination from '@mui/material/TablePagination';
// import { useState } from 'react';
// import { BasicModal } from './overview-modal'
// import PlusIcon from '@heroicons/react/24/solid/PlusIcon';


// const statusMap = {
//   false: 'warning',
//   true: 'success',
//   delayed: 'error'
// };


// export const OverviewLatestPayments = (props) => {
//   const { orders = [], sx } = props;

//   const [page, setPage] = useState(0);
//   const [rowsPerPage, setRowsPerPage] = useState(10);

//   const handleChangePage = (event, newPage) => {
//     setPage(newPage);
//   };

//   const handleChangeRowsPerPage = (event) => {
//     setRowsPerPage(+event.target.value);
//     setPage(0);
//   };

//   const [selectedOrder, setSelectedOrder] = useState(null);

//   return (
//     <Card sx={sx}>
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//       <CardHeader title="Ostatnie faktury" />
//       <Button
//         href='invoice/'
//         sx={{ mr: 10 }}
//         startIcon={(
//           <SvgIcon fontSize="small">
//             <PlusIcon />
//           </SvgIcon>
//         )}
//         variant="contained"
//       >
//         Dodaj
//       </Button>
//       </Box>
//       <Scrollbar sx={{ flexGrow: 1 }}>
//         <Box sx={{ minWidth: 800 }}>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 <TableCell>
//                   Wystawca
//                 </TableCell>
//                 <TableCell>
//                   Nr faktury
//                 </TableCell>
//                 <TableCell>
//                   Kategoria
//                 </TableCell>
//                 <TableCell sortDirection="desc">
//                   Data
//                 </TableCell>
//                 <TableCell>
//                   Kwota
//                 </TableCell>
//                 <TableCell>
//                   Termin płatności
//                 </TableCell>
//                 <TableCell>
//                   Status
//                 </TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {orders
//                 .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
//                 .map((order) => {
//                 // const createdAt = format(order.date, 'dd/MM/yyyy');

//                 return (
//                   <TableRow
//                     hover
//                     key={order.number}
//                     onClick={() => setSelectedOrder(order)}
//                   >
//                     <TableCell>
//                       {order.supplier['name']}
//                     </TableCell>
//                     <TableCell>
//                       {order.number}
//                     </TableCell>
//                     <TableCell>
//                       {order.account ? order.account['category']['name'] : 'Inne'}
//                     </TableCell>
//                     <TableCell>
//                       {order.date}
//                     </TableCell>
//                     <TableCell>
//                       {order.amount}
//                     </TableCell>
//                     <TableCell>
//                       {order.pay_deadline}
//                     </TableCell>
//                     <TableCell>
//                       <SeverityPill color={order.is_paid
//                         ? statusMap[order.is_paid]
//                         : (new Date(order.pay_deadline).getTime() > new Date()
//                           ? statusMap[order.is_paid]
//                           : statusMap['delayed']
//                         )}
//                       >
//                         {order.is_paid
//                           ? "Zapłacone"
//                           : (new Date(order.pay_deadline).getTime() > new Date()
//                             ? "Niezapłacone"
//                             : "Po terminie")
//                         }
//                       </SeverityPill>
//                     </TableCell>
//                   </TableRow>
//                 );
//               })}
//               {selectedOrder && (
//                 <BasicModal
//                   open={true} // Pass an open prop to control the modal's visibility
//                   order={selectedOrder} // Pass the selected order as a prop
//                   onClose={() => setSelectedOrder(null)} // Close the modal when needed
//                 />
//               )}
//             </TableBody>
//           </Table>
//           <TablePagination
//             rowsPerPageOptions={[10, 25, 100]}
//             component="div"
//             count={orders.length}
//             rowsPerPage={rowsPerPage}
//             page={page}
//             onPageChange={handleChangePage}
//             onRowsPerPageChange={handleChangeRowsPerPage}
//           />
//         </Box>
//       </Scrollbar>
//       <Divider />
//       <CardActions sx={{ justifyContent: 'flex-end' }}>
//         <Button
//           color="inherit"
//           endIcon={(
//             <SvgIcon fontSize="small">
//               <ArrowRightIcon />
//             </SvgIcon>
//           )}
//           size="small"
//           variant="text"
//         >
//           View all
//         </Button>
//       </CardActions>
//     </Card>
//   );
// };

// OverviewLatestPayments.prototype = {
//   orders: PropTypes.array,
//   sx: PropTypes.object
// };






import * as React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import { visuallyHidden } from '@mui/utils';
import { SeverityPill } from 'src/components/severity-pill';

const statusMap = {
  false: 'warning',
  true: 'success',
  delayed: 'error'
};

function descendingComparator(a, b, orderBy) {
  console.log(orderBy)
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

// function getComparator(order, orderBy) {
//   return order === 'desc'
//     ? (a, b) => {
//       if (orderBy === 'supplier') {
//         // Handle sorting by the 'supplier.name' attribute
//         return descendingComparator(a.supplier.name, b.supplier.name);
//       }
//       return descendingComparator(a[orderBy], b[orderBy]);
//     }
//   : (a, b) => {
//       if (orderBy === 'supplier') {
//         // Handle sorting by the 'supplier.name' attribute
//         return -descendingComparator(a.supplier.name, b.supplier.name);
//       }
//       return -descendingComparator(a[orderBy], b[orderBy]);
//     };
//     // descendingComparator(a, b, orderBy)
//     // : (a, b) => -descendingComparator(a, b, orderBy);
// }
function getComparator(order, orderBy) {
  return (a, b) => {
    if (orderBy === 'category' || orderBy === 'supplier') {
      // Handle sorting by 'category.name' attribute
      const other = orderBy
      const nameA = a['account'][other]['name'].toLowerCase();
      const nameB = b['account'][other]['name'].toLowerCase();
      if (nameA < nameB) {
        return order === 'asc' ? -1 : 1;
      }
      if (nameA > nameB) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    }
    // Handle sorting by other fields
    return order === 'asc' ? a[orderBy] - b[orderBy] : b[orderBy] - a[orderBy];
  };
}

// Since 2020 all major browsers ensure sort stability with Array.prototype.sort().
// stableSort() brings sort stability to non-modern browsers (notably IE11). If you
// only support modern browsers you can replace stableSort(exampleArray, exampleComparator)
// with exampleArray.slice().sort(exampleComparator)
function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const headCells = [
  {
    id: 'supplier',
    numeric: false,
    disablePadding: true,
    label: 'Wystawca',
  },
  {
    id: 'number',
    numeric: true,
    disablePadding: false,
    label: 'Numer faktury',
  },
  {
    id: 'category',
    numeric: false,
    disablePadding: false,
    label: 'Kategoria',
  },
  {
    id: 'date',
    numeric: true,
    disablePadding: false,
    label: 'Data',
  },
  {
    id: 'amount',
    numeric: true,
    disablePadding: false,
    label: 'Kwota',
  },
  {
    id: 'pay_deadline',
    numeric: true,
    disablePadding: false,
    label: 'Termin płatności',
  },
  {
    id: 'is_paid',
    numeric: false,
    disablePadding: false,
    label: 'Status',
  },
];

function EnhancedTableHead(props) {
  const { order, orderBy, onRequestSort } =
    props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            // align={headCell.numeric ? 'right' : 'left'}
            align='center'
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
};


export default function EnhancedTable(props) {

  const { rows } = props

  const [order, setOrder] = React.useState('desc');
  const [orderBy, setOrderBy] = React.useState('date');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };


  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const visibleRows = React.useMemo(
    () => {
      const startIndex = page * rowsPerPage;
      return stableSort(rows, getComparator(order, orderBy)).slice(
        startIndex,
        startIndex + rowsPerPage
      );
    },
    [order, orderBy, page, rowsPerPage, rows]
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size='medium'
          >
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
            />
            <TableBody>
              {visibleRows.map((row, index) => {
                return (
                  <TableRow
                    hover
                    tabIndex={-1}
                    key={row.number}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell
                      component="th"
                      scope="row"
                      padding="none"
                    >
                      {row.supplier.name}</TableCell>
                    <TableCell align="left">{row.number}</TableCell>
                    <TableCell align="center">{row.account.category.name}</TableCell>
                    <TableCell align="center">{row.date}</TableCell>
                    <TableCell align="center">{row.amount}</TableCell>
                    <TableCell align="center">{row.pay_deadline}</TableCell>
                    <TableCell align="center">
                      <SeverityPill color={row.is_paid
                        ? statusMap[row.is_paid]
                        : (new Date(row.pay_deadline).getTime() > new Date()
                          ? statusMap[row.is_paid]
                          : statusMap['delayed']
                        )}
                      >
                        {row.is_paid
                          ? "Zapłacone"
                          : (new Date(row.pay_deadline).getTime() > new Date()
                            ? "Niezapłacone"
                            : "Po terminie")
                        }
                      </SeverityPill>
                    </TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow                >
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}