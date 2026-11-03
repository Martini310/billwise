import Head from 'next/head';
import { Box, Container, Unstable_Grid2 as Grid, Typography, Skeleton } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { OverviewNewestPayment } from 'src/sections/overview/overview-newest-payment';
import { OverviewMonthlyChart } from 'src/sections/overview/overview-monthly-chart';
import { OverviewPaidPercentage } from 'src/sections/overview/overview-paid-percentage';
import { OverviewCurrentMonth } from 'src/sections/overview/overview-current-month';
import { OverviewNextPayment } from 'src/sections/overview/overview-next-payment';
import { OverviewCategoriesChart } from 'src/sections/overview/overview-categories-chart';
import { OverviewGroupFilter } from 'src/sections/overview/overview-group-filter';
import EnhancedTable from 'src/sections/overview/overview-latest-payments';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { axiosInstance } from 'src/utils/axios';
import { withComponentLoading } from 'src/utils/componentLoading';
import { SumAndSortInvoices } from 'src/utils/parse-invoices';
import axios from 'axios';
import { formatDatetime } from 'src/utils/format-datetime';
import { formatCurrency } from 'src/utils/format-currency';
import Cookies from 'js-cookie';
import { driverObj } from 'src/utils/animated-tour';
import { toast } from 'sonner';

const now = new Date();

const Page = () => {

  const [invoices, setInvoices] = useState([])
  const [categories, setCategories] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [lastSync, setLastSync] = useState()

  const [currentYearAmounts, setCurrentYearAmounts] = useState([]);
  const [previousYearAmounts, setPreviousYearAmounts] = useState([]);
  const [twoYearsAgoAmounts, settwoYearsAgoAmounts] = useState([]);
  const [percentageByCategory, setPercentageByCategory] = useState({});
  const [paidInvoices, setPaidInvoices] = useState(0);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [monthDifference, setMonthDifference] = useState(0);
  const [byCategoryByYear, setByCategoryByYear] = useState({});
  
  const router = useRouter()
  
  const MonthlyChartLoading = withComponentLoading(OverviewMonthlyChart);
  const [appState, setAppState] = useState({
    loading: true,
    chartSeries: null,
    sx: null
  });
  
  
  // Synchronize data from suppliers
  const sync = () => {
    setAppState({...appState, loading:true});
    axiosInstance
      .get('sync/')
      .then((res) => {
        console.log(res);
        router.reload()
      })
      .catch((err) => console.log(err));}
      
      
      // Get data and update states
      useEffect(() => {
        axios.all([
          axiosInstance.get('invoices/'),
          axiosInstance.get('category/'),
          axiosInstance.get('accounts/'),
          axiosInstance.get('groups/')
        ])
        .then(axios.spread((invoicesResponse, categoriesResponse, accountsResponse, groupsResponse) => {

          // Response from invoices/
          setInvoices(invoicesResponse.data);
          if (invoicesResponse.data.length === 0) // Disble loading if no data
          {setAppState({ ...appState, loading: false });};

          // Response from groups/
          setGroups(groupsResponse.data);
          
          // Response from category/
          const categories = categoriesResponse.data;
          const categoryNames = categories.map((category) => category.name);
          setCategories(categoryNames);

          // Set Last Sync Date
          const date = new Date(accountsResponse.data[0]?.last_sync);
          const formatedDate = Number.isNaN(date.getTime())
            ? 'Dodaj konto, aby zsynchronizować dane.'
            : formatDatetime(date);
          setLastSync(formatedDate);

          // Animated tour
          if ( !Cookies.get('DisableAnimatedTour') ) driverObj.drive();

        }))
        .catch((err) => console.log(err))
  }, [setInvoices, setCategories, setAppState]
  )


  // Restore the last selected group once per mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('billwise.selectedGroup');
      if (saved) {
        setSelectedGroup(saved === 'all' || saved === 'none' ? saved : Number(saved));
      }
    } catch (e) { /* localStorage unavailable */ }
  }, []);

  const handleGroupChange = (value) => {
    setSelectedGroup(value);
    try { localStorage.setItem('billwise.selectedGroup', String(value)); } catch (e) { /* ignore */ }
  };

  // Manual paid/unpaid toggle (optimistic + PATCH).
  const handleTogglePaid = (invoice) => {
    const next = !invoice.is_paid;
    setInvoices((prev) => prev.map((i) => (i.id === invoice.id
      ? { ...i, is_paid: next, amount_to_pay: next ? 0 : i.amount } : i)));
    axiosInstance.patch(`invoices/${invoice.id}/`, { is_paid: next, amount_to_pay: next ? 0 : invoice.amount })
      .catch(() => {
        setInvoices((prev) => prev.map((i) => (i.id === invoice.id
          ? { ...i, is_paid: invoice.is_paid, amount_to_pay: invoice.amount_to_pay } : i)));
        toast.error('Nie udało się zmienić statusu');
      });
  };

  // Group of an invoice: provider account's group, or (for manual recurring
  // payments) the recurring payment's group.
  const invoiceGroupId = (inv) => inv.account?.group?.id ?? inv.recurring?.group?.id;

  const shownInvoices = useMemo(() => {
    if (selectedGroup === 'all') return invoices;
    if (selectedGroup === 'none') return invoices.filter((inv) => !invoiceGroupId(inv));
    return invoices.filter((inv) => invoiceGroupId(inv) === selectedGroup);
  }, [invoices, selectedGroup]);

  const hasUngrouped = useMemo(
    () => invoices.some((inv) => !(inv.account?.group || inv.recurring?.group)),
    [invoices]
  );

  useEffect(() => {
    if (invoices.length === 0) {
      return; // Wait for the fetch; the truly-empty case is handled on load.
    }

    if (shownInvoices.length > 0) {
      const [
        currentYearAmounts,
        previousYearAmounts,
        twoYearsAgoAmounts,
        percentageByCategory,
        paidInvoices,
        unpaidInvoices,
        monthDifference,
        byCategoryByYear,
      ] = SumAndSortInvoices(shownInvoices, categories);

      setCurrentYearAmounts(currentYearAmounts);
      setPreviousYearAmounts(previousYearAmounts);
      settwoYearsAgoAmounts(twoYearsAgoAmounts);
      setPercentageByCategory(percentageByCategory);
      setPaidInvoices(paidInvoices);
      setUnpaidInvoices(unpaidInvoices);
      setMonthDifference(monthDifference);
      setByCategoryByYear(byCategoryByYear);
    } else {
      // Selected group has no invoices — reset the widgets to zero.
      setCurrentYearAmounts(Array(12).fill(0));
      setPreviousYearAmounts(Array(12).fill(0));
      settwoYearsAgoAmounts(Array(12).fill(0));
      setPercentageByCategory({});
      setPaidInvoices(0);
      setUnpaidInvoices([]);
      setMonthDifference(0);
      setByCategoryByYear({});
    }

    setAppState((prev) => ({ ...prev, loading: false }));
  }, [shownInvoices, categories]);

  const newestInvoice = shownInvoices[0]
  const year = new Date().getFullYear()

  // Three-year comparison series for the monthly chart (single-colour view).
  const yearSeries = [
    { name: year - 2, data: twoYearsAgoAmounts },
    { name: year - 1, data: previousYearAmounts },
    { name: year, data: currentYearAmounts },
  ];

  // Donut shows only categories that actually have spending (skip empty ones).
  const categoryEntries = Object.entries(percentageByCategory).filter(([, value]) => value > 0);

  return (
  <>
    <Head>
      <title>
        Strona Główna | BillWise
      </title>
    </Head>
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 8
      }}
    >
      <Container maxWidth="xl">
        <Grid
          container
          spacing={3}
        >
          {groups.length > 0 && (
            <Grid xs={12} sx={{ pb: 0 }}>
              <OverviewGroupFilter
                groups={groups}
                hasUngrouped={hasUngrouped}
                value={selectedGroup}
                onChange={handleGroupChange}
              />
            </Grid>
          )}
          <Grid
            className='overview-newest-payment'
            xs={12}
            sm={6}
            lg={3}
          >
            <OverviewNewestPayment
              supplier={appState.loading ? <Skeleton width={'50px'}/> : (newestInvoice ? (newestInvoice?.account?.supplier?.name ?? 'Inne') : "Brak faktur")}
              sx={{ height: '100%' }}
              value={appState.loading ? <Skeleton /> :( newestInvoice ? formatCurrency(newestInvoice.amount) : '—' )}
            />
          </Grid>
          <Grid
            className='overview-current-month'
            xs={12}
            sm={6}
            lg={3}
          >
            <OverviewCurrentMonth
              difference={+monthDifference.toFixed(2)} // '+' convert value back to a Number
              positive={monthDifference > 0}
              sx={{ height: '100%' }}
              value={appState.loading ? <Skeleton /> : formatCurrency(currentYearAmounts[now.getMonth()] || 0)}
            />
          </Grid>
          <Grid
            className='overview-paid-percentage'
            xs={12}
            sm={6}
            lg={3}
            >
            <OverviewPaidPercentage
              sx={{ height: '100%' }}
              value={appState.loading ? <Skeleton /> : (parseFloat((paidInvoices / shownInvoices.length * 100).toFixed(0)) || 0)}
            />
          </Grid>
          <Grid
            className='overview-next-payment'
            xs={12}
            sm={6}
            lg={3}
          >
            <OverviewNextPayment
              sx={{ height: '100%' }}
              value={appState.loading ? <Skeleton /> : ( unpaidInvoices[0] ? formatCurrency(unpaidInvoices[0].amount) : (unpaidInvoices.length === 0 ? "Brak faktur do wyświetlenia" : "Wszystko opłacone!" ))}
              supplier={appState.loading ? <Skeleton width={'50px'}/> : ( unpaidInvoices[0] ? (unpaidInvoices[0]?.account?.supplier?.name ?? 'Inne') : "---" )}
              date={appState.loading ? <Skeleton width={'50px'}/> : ( unpaidInvoices[0] ? unpaidInvoices[0].pay_deadline : "---" )}
            />
          </Grid>
          <Grid
            xs={12}
            lg={12}
            sx={{ py: 0 }}
          >
            <Typography
              color="text.secondary"
              variant="body2"
            >
              Ostatnia synchronizacja: {lastSync}
            </Typography>
          </Grid>
          <Grid
            className='overview-monthly-chart'
            xs={12}
            lg={8}
          >
            {/* <MonthlyChartLoading isLoading={appState.loading}  */}

            <OverviewMonthlyChart
              yearSeries={yearSeries}
              byCategoryByYear={byCategoryByYear}
              sx={{ height: '100%' }}
              sync={sync}
              title='Podsumowanie'
              overview="/details/"
            />

          </Grid>
          <Grid
            className='overview-categories-chart'
            xs={12}
            md={6}
            lg={4}
          >
            <OverviewCategoriesChart
              chartSeries={categoryEntries.map(([, value]) => value)}
              labels={categoryEntries.map(([name]) => name)}
              sx={{ height: '100%' }}
              />
          </Grid>
          
          <Grid
            className='latest-invoices'
            xs={12}
            md={12}
            lg={12}
          >
            <EnhancedTable
              rows={shownInvoices}
              onTogglePaid={handleTogglePaid}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  </>
)};

Page.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;
