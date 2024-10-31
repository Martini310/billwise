import Head from 'next/head';
import { Box, Container, Unstable_Grid2 as Grid, Typography, Skeleton } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { OverviewNewestPayment } from 'src/sections/overview/overview-newest-payment';
import { OverviewMonthlyChart } from 'src/sections/overview/overview-monthly-chart';
import { OverviewPaidPercentage } from 'src/sections/overview/overview-paid-percentage';
import { OverviewCurrentMonth } from 'src/sections/overview/overview-current-month';
import { OverviewNextPayment } from 'src/sections/overview/overview-next-payment';
import { OverviewCategoriesChart } from 'src/sections/overview/overview-categories-chart';
import EnhancedTable from 'src/sections/overview/overview-latest-payments';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { axiosInstance } from 'src/utils/axios';
import { withComponentLoading } from 'src/utils/componentLoading';
import { SumAndSortInvoices } from 'src/utils/parse-invoices';
import axios from 'axios';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { formatDatetime } from 'src/utils/format-datetime';


const driverObj = driver({
  showProgress: true,
  nextBtnText: 'Następny',
  prevBtnText: 'Poprzedni',
  doneBtnText: 'Gotowe',
  steps: [
    { element: '.overview-newest-payment', popover: { title: 'Najnowsza faktura', description: 'Tutaj zobaczysz informacje o Twojej najnowszej fakturze.' } },
    { element: '.overview-current-month', popover: { title: 'Podsumowanie aktualnego miesiąca', description: 'Podsumowanie wszystkich płatności w bierzącym miesiącu.' } },
    { element: '.overview-paid-percentage', popover: { title: 'Procent zapłaconych faktur', description: 'Tu zobaczysz ile procent faktur masz już opłacone.' } },
    { element: '.overview-next-payment', popover: { title: 'Dane najbliższej płatności', description: 'Informacje o fakturze z najbliższą datą płatności.' } },
    { element: '.overview-monthly-chart', popover: { title: 'Podsumowanie roku', description: 'Wykres miesięcznych wydatków z porównaniem do poprzedniego roku.' } },
    { element: '.overview-categories-chart', popover: { title: 'Wykres kategorii', description: 'Podział płatności według kategorii.' } },
    { element: '.latest-invoices', popover: { title: 'Ostatnie faktury', description: 'Tu masz podgląd na 10 ostatnich faktur. Mozesz kliknąć na wybraną fakturę, żeby zobaczyć szczegóły.' } },
  ]
});

const now = new Date();


const Page = () => {

  const [invoices, setInvoices] = useState([])
  const [categories, setCategories] = useState([])
  const [lastSync, setLastSync] = useState()

  const [currentYearAmounts, setCurrentYearAmounts] = useState([]);
  const [previousYearAmounts, setPreviousYearAmounts] = useState([]);
  const [twoYearsAgoAmounts, settwoYearsAgoAmounts] = useState([]);
  const [percentageByCategory, setPercentageByCategory] = useState({});
  const [paidInvoices, setPaidInvoices] = useState(0);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [monthDifference, setMonthDifference] = useState(0);
  
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
          axiosInstance.get('accounts/')
        ])
        .then(axios.spread((invoicesResponse, categoriesResponse, accountsResponse) => {
          
          // Response from invoices/
          setInvoices(invoicesResponse.data);
          if (invoicesResponse.data.length === 0) // Disble loading if no data
          {setAppState({ ...appState, loading: false });};
          
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
          driverObj.drive();
        }))
        .catch((err) => console.log(err))
  }, [setInvoices, setCategories, setAppState]
  )


  useEffect(() => {
    // Check if invoices data is available
    if (invoices.length > 0) {

      // Calculate the other variables based on the invoices data
      const [
        currentYearAmounts,
        previousYearAmounts,
        twoYearsAgoAmounts,
        percentageByCategory,
        paidInvoices,
        unpaidInvoices,
        monthDifference,
      ] = SumAndSortInvoices(invoices, categories);

      // Update the state variables with the calculated data
      setCurrentYearAmounts(currentYearAmounts);
      setPreviousYearAmounts(previousYearAmounts);
      settwoYearsAgoAmounts(twoYearsAgoAmounts);
      setPercentageByCategory(percentageByCategory);
      setPaidInvoices(paidInvoices);
      setUnpaidInvoices(unpaidInvoices);
      setMonthDifference(monthDifference);

      setAppState({ ...appState, loading: false });
    }
  }, [invoices, categories]);

  const newestInvoice = invoices[0]
  const year = new Date().getFullYear()

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
          <Grid
            className='overview-newest-payment'
            xs={12}
            sm={6}
            lg={3}
          >
            <OverviewNewestPayment
              supplier={appState.loading ? <Skeleton width={'50px'}/> : (newestInvoice ? (newestInvoice?.account?.supplier?.name ?? 'Inne') : "Brak faktur")}
              sx={{ height: '100%' }}
              value={appState.loading ? <Skeleton /> :( newestInvoice ? newestInvoice.amount + "zł" : '---' )}
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
              value={appState.loading ? <Skeleton /> : (currentYearAmounts[now.getMonth()]
                      ? currentYearAmounts[now.getMonth()].toFixed(2)+"zł"
                      : '0')
                    }
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
              value={appState.loading ? <Skeleton /> : (parseFloat((paidInvoices / invoices.length * 100).toFixed(0)) || 0)}
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
              value={appState.loading ? <Skeleton /> : ( unpaidInvoices[0] ? unpaidInvoices[0].amount + "zł" : (unpaidInvoices.length === 0 ? "Brak faktur do wyświetlenia" : "Wszystko opłacone!" ))}
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
              chartSeries={[
                {
                  name: year - 2,
                  data: twoYearsAgoAmounts
                },
                {
                  name: year - 1,
                  data: previousYearAmounts
                },
                {
                  name: year,
                  data: currentYearAmounts
                }
              ]}
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
              chartSeries={Object.values(percentageByCategory)}
              labels={Object.keys(percentageByCategory)}
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
              rows={invoices}
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
