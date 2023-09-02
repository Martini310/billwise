import { format } from 'date-fns';
import PropTypes from 'prop-types';
import ArrowRightIcon from '@heroicons/react/24/solid/ArrowRightIcon';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardHeader,
  Divider,
  SvgIcon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { Scrollbar } from 'src/components/scrollbar';
import { SeverityPill } from 'src/components/severity-pill';
import TablePagination from '@mui/material/TablePagination';
import { useState } from 'react';
import { BasicModal } from './overview-modal'
import PlusIcon from '@heroicons/react/24/solid/PlusIcon';


const statusMap = {
  false: 'warning',
  true: 'success',
  delayed: 'error'
};

export const OverviewLatestPayments = (props) => {
  const { orders = [], sx } = props;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <Card sx={sx}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <CardHeader title="Ostatnie faktury" />
      <Button
        href='invoice/'
        sx={{ mr: 10 }}
        startIcon={(
          <SvgIcon fontSize="small">
            <PlusIcon />
          </SvgIcon>
        )}
        variant="contained"
      >
        Dodaj
      </Button>
      </Box>
      <Scrollbar sx={{ flexGrow: 1 }}>
        <Box sx={{ minWidth: 800 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  Wystawca
                </TableCell>
                <TableCell>
                  Nr faktury
                </TableCell>
                <TableCell>
                  Kategoria
                </TableCell>
                <TableCell sortDirection="desc">
                  Data
                </TableCell>
                <TableCell>
                  Kwota
                </TableCell>
                <TableCell>
                  Termin płatności
                </TableCell>
                <TableCell>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((order) => {
                // const createdAt = format(order.date, 'dd/MM/yyyy');

                return (
                  <TableRow
                    hover
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <TableCell>
                      {order.supplier['name']}
                    </TableCell>
                    <TableCell>
                      {order.number}
                    </TableCell>
                    <TableCell>
                      {order.account ? order.account['category']['name'] : 'Inne'}
                    </TableCell>
                    <TableCell>
                      {order.date}
                    </TableCell>
                    <TableCell>
                      {order.amount}
                    </TableCell>
                    <TableCell>
                      {order.pay_deadline}
                    </TableCell>
                    <TableCell>
                      <SeverityPill color={order.is_paid
                        ? statusMap[order.is_paid]
                        : (new Date(order.pay_deadline).getTime() > new Date()
                          ? statusMap[order.is_paid]
                          : statusMap['delayed']
                        )}
                      >
                        {order.is_paid
                          ? "Zapłacone"
                          : (new Date(order.pay_deadline).getTime() > new Date()
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
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 100]}
            component="div"
            count={orders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      </Scrollbar>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button
          color="inherit"
          endIcon={(
            <SvgIcon fontSize="small">
              <ArrowRightIcon />
            </SvgIcon>
          )}
          size="small"
          variant="text"
        >
          View all
        </Button>
      </CardActions>
    </Card>
  );
};

OverviewLatestPayments.prototype = {
  orders: PropTypes.array,
  sx: PropTypes.object
};
