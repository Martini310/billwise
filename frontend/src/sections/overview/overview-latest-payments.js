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
import { BasicModal } from './overview-modal'


const statusMap = {
  false: 'warning',
  true: 'success',
  delayed: 'error'
};

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
  const [selectedOrder, setSelectedOrder] = React.useState(null);

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
              {visibleRows.map((row) => {
                return (
                  <TableRow
                    hover
                    tabIndex={-1}
                    key={row.number}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setSelectedOrder(row)}
                  >
                    <TableCell
                      component="th"
                      scope="row"
                    >
                      {row.supplier.name}</TableCell>
                    <TableCell>{row.number}</TableCell>
                    <TableCell>{row.account.category.name}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.amount}</TableCell>
                    <TableCell>{row.pay_deadline}</TableCell>
                    <TableCell>
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
              {selectedOrder && (
                 <BasicModal
                   open={true} // Pass an open prop to control the modal's visibility
                   order={selectedOrder} // Pass the selected order as a prop
                   onClose={() => setSelectedOrder(null)} // Close the modal when needed
                 />
               )}
              {emptyRows > 0 && (
                <TableRow                >
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
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