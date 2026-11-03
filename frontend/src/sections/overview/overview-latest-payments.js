import * as React from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardHeader,
  Chip,
  Divider,
  Stack,
  SvgIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles';
import PropTypes from 'prop-types';
import PlusIcon from '@heroicons/react/24/solid/PlusIcon';
import { visuallyHidden } from '@mui/utils';
import { SeverityPill } from 'src/components/severity-pill';
import { getCategoryMeta } from 'src/utils/categories';
import { formatCurrency } from 'src/utils/format-currency';
import { BasicModal } from './overview-modal'

// "2026-10-06" -> "06.10.2026" (czytelniejszy format daty); inne wartości bez zmian.
const formatDate = (value) => {
  if (!value || typeof value !== 'string') return value ?? '—';
  const parts = value.slice(0, 10).split('-');
  return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : value;
};

const SupplierCell = ({ name }) => {
  const label = name ?? 'Inne';
  return (
    <Stack alignItems="center" direction="row" spacing={1.5}>
      <Avatar
        src={`/assets/logos/logo-${label.toLowerCase()}.png`}
        variant="rounded"
        sx={{ width: 32, height: 32, bgcolor: 'background.default', '& img': { objectFit: 'contain' } }}
        imgProps={{ onError: (e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/logos/logo-inne.png'; } }}
      />
      <Typography variant="subtitle2">{label}</Typography>
    </Stack>
  );
};

const CategoryChip = ({ name }) => {
  const label = name ?? 'Inne';
  const { color, Icon } = getCategoryMeta(label);
  return (
    <Chip
      size="small"
      icon={<Icon style={{ color, fontSize: 16 }} />}
      label={label}
      sx={{
        backgroundColor: alpha(color, 0.12),
        color,
        fontWeight: 600,
        '& .MuiChip-icon': { color },
      }}
    />
  );
};


const statusMap = {
  false: 'warning',
  true: 'success',
  delayed: 'error'
};

const headCells = [
  {
    id: 'supplier',
    numeric: false,
    label: 'Wystawca',
  },
  {
    id: 'number',
    numeric: false,
    label: 'Numer faktury',
  },
  {
    id: 'category',
    numeric: false,
    label: 'Kategoria',
  },
  {
    id: 'date',
    numeric: false,
    label: 'Data',
  },
  {
    id: 'amount',
    numeric: true,
    label: 'Kwota',
  },
  {
    id: 'pay_deadline',
    numeric: false,
    label: 'Termin płatności',
  },
  {
    id: 'is_paid',
    numeric: false,
    label: 'Status',
  },
];

function getComparator(order, orderBy) {
  return (a, b) => {
    let nameA;
    let nameB;
    // Handle sorting by numeric fields
    if (headCells.find(x => x.id === orderBy).numeric) {
      return order === 'asc' ? a[orderBy] - b[orderBy] : b[orderBy] - a[orderBy];
    }
    
    if (orderBy === 'supplier') {
      nameA = a.account ? a['account']['supplier']['name'] : 'inne';
      nameB = b.account ? b['account']['supplier']['name'] : 'inne';
    } else if (orderBy === 'category') {
      nameA = a['category']['name'];
      nameB = b['category']['name'];
    } else {
      nameA = a[orderBy]
      nameB = b[orderBy]
    }
    if (nameA < nameB) {
      return order === 'asc' ? -1 : 1;
    }
    if (nameA > nameB) {
      return order === 'asc' ? 1 : -1;
    }
    return 0;
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
            align={headCell.numeric ? 'right' : 'left'}
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
    <Card sx={{ width: '100%' }}>
      <CardHeader
        title="Ostatnie faktury"
        action={(
          <Button
            href='invoice/'
            startIcon={(
              <SvgIcon fontSize="small">
                <PlusIcon />
              </SvgIcon>
            )}
            variant="contained"
          >
            Dodaj
          </Button>
        )}
      />
      <Divider />
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
                      <SupplierCell name={row.account?.supplier?.name} />
                    </TableCell>
                    <TableCell>{row.number}</TableCell>
                    <TableCell><CategoryChip name={row?.category?.name} /></TableCell>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2">{formatCurrency(row.amount)}</Typography>
                    </TableCell>
                    <TableCell>{formatDate(row.pay_deadline)}</TableCell>
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
                <TableRow>
                  <TableCell colSpan={7} />
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
    </Card>
  );
}