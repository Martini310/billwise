import * as React from 'react';
import {
  Box,
  Button,
  Card,
  CardHeader,
  Chip,
  Divider,
  IconButton,
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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import EditIcon from '@mui/icons-material/EditOutlined';
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

const SupplierCell = ({ name, recurring }) => {
  const label = name ?? 'Inne';
  return (
    <Stack alignItems="center" direction="row" spacing={1.5}>
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexShrink: 0,
          height: 28,
          justifyContent: 'center',
          width: 48,
        }}
      >
        {recurring ? (
          <Box sx={{
            alignItems: 'center',
            backgroundColor: 'primary.alpha12',
            borderRadius: '8px',
            color: 'primary.main',
            display: 'flex',
            height: 28,
            justifyContent: 'center',
            width: 28,
          }}>
            <AutorenewIcon sx={{ fontSize: 18 }} />
          </Box>
        ) : (
          <Box
            component="img"
            alt={label}
            src={`/assets/logos/logo-${label.toLowerCase()}.png`}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/logos/logo-inne.png'; }}
            sx={{ display: 'block', maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
          />
        )}
      </Box>
      <Typography variant="subtitle2">{label}</Typography>
    </Stack>
  );
};

const GroupTag = ({ group }) => {
  if (!group) {
    return <Typography variant="body2" color="text.secondary">—</Typography>;
  }
  return (
    <Chip
      size="small"
      label={group.name}
      sx={{ backgroundColor: alpha(group.color, 0.12), color: group.color, fontWeight: 600 }}
    />
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


// Komórka kwoty: dla faktur z opłat cyklicznych edytowalna inline; faktury
// "szacowane" (zmienna kwota, jeszcze nie potwierdzona) dostają znacznik.
const AmountCell = ({ row, onEditAmount }) => {
  const editable = !!row.recurring && !!onEditAmount;
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(String(row.amount ?? ''));

  React.useEffect(() => { setDraft(String(row.amount ?? '')); }, [row.amount]);

  if (editing) {
    const commit = () => {
      setEditing(false);
      if (draft !== '' && parseFloat(draft) !== row.amount) onEditAmount(row, draft);
    };
    return (
      <TextField
        autoFocus
        size="small"
        type="number"
        value={draft}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.stopPropagation(); commit(); }
          if (e.key === 'Escape') { setDraft(String(row.amount ?? '')); setEditing(false); }
        }}
        inputProps={{ style: { textAlign: 'right' } }}
        sx={{ width: 120 }}
      />
    );
  }

  return (
    <Stack alignItems="center" direction="row" justifyContent="flex-end" spacing={0.5}>
      {row.estimated && (
        <Tooltip title="Kwota szacowana — kliknij ołówek, aby uzupełnić">
          <Chip size="small" color="warning" variant="outlined" label="do uzupełnienia"
            sx={{ height: 20, '& .MuiChip-label': { px: 0.75, fontSize: 11 } }} />
        </Tooltip>
      )}
      <Typography variant="subtitle2" sx={{ color: row.estimated ? 'text.secondary' : 'text.primary' }}>
        {formatCurrency(row.amount)}
      </Typography>
      {editable && (
        <Tooltip title="Edytuj kwotę">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditing(true); }}>
            <EditIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
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
    id: 'group',
    numeric: false,
    label: 'Grupa',
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
      nameA = a.account?.supplier?.name ?? a.recurring?.name ?? 'inne';
      nameB = b.account?.supplier?.name ?? b.recurring?.name ?? 'inne';
    } else if (orderBy === 'category') {
      nameA = a['category']['name'];
      nameB = b['category']['name'];
    } else if (orderBy === 'group') {
      nameA = a.account?.group?.name ?? a.recurring?.group?.name ?? '';
      nameB = b.account?.group?.name ?? b.recurring?.group?.name ?? '';
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

  const { rows, onTogglePaid, onEditAmount } = props

  const [order, setOrder] = React.useState('desc');
  const [orderBy, setOrderBy] = React.useState('date');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [query, setQuery] = React.useState('');

  const categoryOptions = React.useMemo(
    () => [...new Set(rows.map((r) => r?.category?.name).filter(Boolean))].sort(),
    [rows]
  );

  const filteredRows = React.useMemo(() => rows.filter((row) => {
    if (statusFilter === 'paid' && !row.is_paid) return false;
    if (statusFilter === 'unpaid' && row.is_paid) return false;
    if (categoryFilter && row?.category?.name !== categoryFilter) return false;
    if (query) {
      const hay = `${row.number} ${row.account?.supplier?.name ?? row.recurring?.name ?? ''}`.toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  }), [rows, statusFilter, categoryFilter, query]);

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
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredRows.length) : 0;

  const visibleRows = React.useMemo(
    () => {
      const startIndex = page * rowsPerPage;
      return stableSort(filteredRows, getComparator(order, orderBy)).slice(
        startIndex,
        startIndex + rowsPerPage
      );
    },
    [order, orderBy, page, rowsPerPage, filteredRows]
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
      <Stack
        alignItems="center"
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ px: 2, pb: 2 }}
      >
        <TextField
          size="small"
          placeholder="Szukaj (numer, wystawca)…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <TextField
          size="small"
          select
          label="Status"
          SelectProps={{ native: true }}
          InputLabelProps={{ shrink: true }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          sx={{ minWidth: 150 }}
        >
          <option value="all">Wszystkie</option>
          <option value="paid">Zapłacone</option>
          <option value="unpaid">Niezapłacone</option>
        </TextField>
        <TextField
          size="small"
          select
          label="Kategoria"
          SelectProps={{ native: true }}
          InputLabelProps={{ shrink: true }}
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
          sx={{ minWidth: 150 }}
        >
          <option value="">Wszystkie</option>
          {categoryOptions.map((name) => (<option key={name} value={name}>{name}</option>))}
        </TextField>
      </Stack>
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
                      <SupplierCell
                        name={row.account?.supplier?.name ?? row.recurring?.name}
                        recurring={!row.account && !!row.recurring}
                      />
                    </TableCell>
                    <TableCell>{row.number}</TableCell>
                    <TableCell><CategoryChip name={row?.category?.name} /></TableCell>
                    <TableCell><GroupTag group={row.account?.group ?? row.recurring?.group} /></TableCell>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell align="right">
                      <AmountCell row={row} onEditAmount={onEditAmount} />
                    </TableCell>
                    <TableCell>{formatDate(row.pay_deadline)}</TableCell>
                    <TableCell
                      sx={{ cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); if (onTogglePaid) onTogglePaid(row); }}
                    >
                      <Tooltip title="Kliknij, aby zmienić status">
                        <span>
                          <SeverityPill
                            style={{ cursor: 'pointer' }}
                            color={row.is_paid
                              ? statusMap[row.is_paid]
                              : (new Date(row.pay_deadline).getTime() > new Date()
                                ? statusMap[row.is_paid]
                                : statusMap['delayed'])}
                          >
                            {row.is_paid
                              ? "Zapłacone"
                              : (new Date(row.pay_deadline).getTime() > new Date()
                                ? "Niezapłacone"
                                : "Po terminie")}
                          </SeverityPill>
                        </span>
                      </Tooltip>
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
                  <TableCell colSpan={8} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={filteredRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
    </Card>
  );
}