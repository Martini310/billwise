import Head from 'next/head';
import { Box, Container, Unstable_Grid2 as Grid } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { OverviewNewestPayment } from 'src/sections/overview/overview-newest-payment';
import { OverviewLatestPayments } from 'src/sections/overview/overview-latest-payments';
import { OverviewMonthlyChart } from 'src/sections/overview/overview-monthly-chart';
import { OverviewPaidPercentage } from 'src/sections/overview/overview-paid-percentage';
import { OverviewCurrentMonth } from 'src/sections/overview/overview-current-month';
import { OverviewNextPayment } from 'src/sections/overview/overview-next-payment';
import { OverviewCategoriesChart } from 'src/sections/overview/overview-categories-chart';
import { useState, useEffect } from 'react';
import { axiosInstance } from 'src/utils/axios';
import { withComponentLoading } from 'src/utils/componentLoading';
import {useRouter} from 'next/router';
import { SumAndSortInvoices } from 'src/utils/parse-invoices';
import axios from 'axios';


const now = new Date();


const Page = () => {

  const [invoices, setInvoices] = useState([])
  const [categories, setCategories] = useState([])

  const [currentYearAmounts, setCurrentYearAmounts] = useState([]);
  const [previousYearAmounts, setPreviousYearAmounts] = useState([]);
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
      axiosInstance.get('category/')
    ])
    .then(axios.spread((invoicesResponse, categoriesResponse) => {

      // Response from invoices/
      setInvoices(invoicesResponse.data);

      // Response from category/
      const categories = categoriesResponse.data;
      const categoryNames = categories.map((category) => category.name);
      setCategories(categoryNames);
      }
    ))
  }, [setInvoices, setCategories, setAppState]
  )


  useEffect(() => {
    // Check if invoices data is available
    if (invoices.length > 0) {

      // Calculate the other variables based on the invoices data
      const [
        currentYearAmounts,
        previousYearAmounts,
        percentageByCategory,
        paidInvoices,
        unpaidInvoices,
        monthDifference,
       ] = SumAndSortInvoices(invoices, categories);

      // Update the state variables with the calculated data
      setCurrentYearAmounts(currentYearAmounts);
      setPreviousYearAmounts(previousYearAmounts);
      setPercentageByCategory(percentageByCategory);
      setPaidInvoices(paidInvoices);
      setUnpaidInvoices(unpaidInvoices);
      setMonthDifference(monthDifference);

      setAppState({ ...appState, loading: false });
    }
  }, [invoices, categories]);

  const newestInvoice = invoices[0]
  
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
            xs={12}
            sm={6}
            lg={3}
          >
            <OverviewNewestPayment
              supplier={newestInvoice ? newestInvoice.supplier.name : "Brak faktur"}
              sx={{ height: '100%' }}
              value={newestInvoice ? newestInvoice.amount + "zł" : "---"}
            />
          </Grid>
          <Grid
            xs={12}
            sm={6}
            lg={3}
          >
            <OverviewCurrentMonth
              difference={+monthDifference.toFixed(2)} // '+' convert value back to a Number
              positive={monthDifference > 0}
              sx={{ height: '100%' }}
              value={currentYearAmounts[now.getMonth()]
                      ? currentYearAmounts[now.getMonth()].toFixed(2)+"zł"
                      : '0'
                    }
            />
          </Grid>
          <Grid
            xs={12}
            sm={6}
            lg={3}
          >
            <OverviewPaidPercentage
              sx={{ height: '100%' }}
              value={parseFloat((paidInvoices / invoices.length * 100).toFixed(0))}
            />
          </Grid>
          <Grid
            xs={12}
            sm={6}
            lg={3}
          >
            <OverviewNextPayment
              sx={{ height: '100%' }}
              value={unpaidInvoices[0] ? unpaidInvoices[0].amount + "zł" : "Wszystkie faktury opłacone!"}
              supplier={unpaidInvoices[0] ? unpaidInvoices[0].supplier.name : "---"}
              date={unpaidInvoices[0] ? unpaidInvoices[0].pay_deadline : "---"}
            />
          </Grid>
          <Grid
            xs={12}
            lg={8}
          >
            <MonthlyChartLoading isLoading={appState.loading} 
              chartSeries={[
                {
                  name: 'Last year',
                  data: previousYearAmounts
                },
                {
                  name: 'This year',
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
            xs={12}
            md={6}
            lg={4}
          >
            <OverviewCategoriesChart
              chartSeries={Object.values(percentageByCategory)}
              labels={Object.keys(percentageByCategory)}
              sx={{ height: '100%' }}
              />
              {console.log(percentageByCategory)}
          </Grid>
          
          <Grid
            xs={12}
            md={12}
            lg={12}
          >
            <OverviewLatestPayments
              orders={invoices}
              sx={{ height: '100%' }}
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
