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


const now = new Date();


const Page = () => {

  const [invoices, setInvoices] = useState([])
  const [categories, setCategories] = useState([])
  const router = useRouter()

  
  const MonthlyChartLoading = withComponentLoading(OverviewMonthlyChart);
  const [appState, setAppState] = useState({
    loading: true,
    chartSeries: null,
    sx: null
  });

  // Fetch invoices and sort them by date
  useEffect(() => {
      axiosInstance
        .get('invoices/')
        .then((res) => {
          setInvoices(res.data);
          setAppState({...appState, loading:false})
          }
        )
  }, [setInvoices]);

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

  // Fetch Categories and create an array with category names
  useEffect(() => {
    axiosInstance
      .get('category/')
      .then((res) => {
        const categories = res.data;
        const categoryNames = categories.map((category) => category.name);
        setCategories(categoryNames);
      });
  }, [setCategories]);


  const SumAndSortInvoices = (invoices, year) => {
    let sortedInvoices = {}
    invoices.forEach((invoice) => {
      const month = invoice.date.slice(5, 7);
      const amount = parseFloat((invoice.amount).toFixed(2))
      if (invoice.date.startsWith(year)) {
        sortedInvoices[month] = (sortedInvoices[month] || 0) + amount;
      }})
    const sortedValues = Object.keys(sortedInvoices)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map((key) => sortedInvoices[key]);
    return sortedValues
  }

  const SumAndSortInvoices3 = (invoices, year) => {
    // Create an array to store the summed invoice amounts for each month
    const monthlyAmounts = Array(12).fill(0);
  
    // Sum the invoice amounts for each month within the specified year
    invoices.forEach((invoice) => {
      const invoiceYear = new Date(invoice.date).getFullYear();
      if (invoiceYear === year) {
        const month = new Date(invoice.date).getMonth();
        const amount = parseFloat(invoice.amount);
        monthlyAmounts[month] += amount;
      }
    });
  
    // Sort the monthly amounts
    const sortedValues = monthlyAmounts
      .map((amount, monthIndex) => ({
        month: monthIndex + 1, // Months are 0-indexed, so add 1 to make them 1-12
        amount: amount,
      }))
      .sort((a, b) => a.month - b.month)
      .map((item) => item.amount);
  
    return sortedValues;
  };

  const lastYear = {};
  const thisYear = {};
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();

  // Fill arrays with this year and previous year invoices
  invoices.forEach((invoice) => {
    const month = invoice.date.slice(5, 7);
    if (invoice.date.startsWith(year)) {
      thisYear[month] = (thisYear[month] || 0) + parseFloat((invoice.amount).toFixed(2));
    } else if (invoice.date.startsWith(year - 1)) {
      lastYear[month] = (lastYear[month] || 0) + parseFloat((invoice.amount).toFixed(2));
    }
  });

  
  const sortedThisYear = Object.keys(thisYear)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map((key) => thisYear[key]);

  const sortedLastYear = Object.keys(lastYear)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map((key) => lastYear[key]);

    const sortedThisYear2 = SumAndSortInvoices(invoices, year)
    const sortedThisYear3 = SumAndSortInvoices3(invoices, year)
    // const sortedLastYear = lastYear
    console.log(sortedThisYear, sortedThisYear2, sortedThisYear3)

  const categoryTotalAmount = {};
  let totalAmount = 0;

  categories.forEach(category => {
    categoryTotalAmount[category] = 0;
  });

  let paidInvoices = 0;
  let unPaidInvoices = []

  // Sum invoices amounts by categories and count paid an unpaid invoices
  invoices.forEach((invoice) => {
    invoice.account && (categoryTotalAmount[invoice.account.category.name] += invoice.amount);
    totalAmount += invoice.amount;
    if (invoice.is_paid) {
      paidInvoices += 1
    } else {
      unPaidInvoices.push(invoice)
    }
  })
  
  const categoryPercentageValues = {};
  // Count percentage of each category
  categories.forEach((category) => {
    const categoryAmount = categoryTotalAmount[category];
    const percentage = (categoryAmount / totalAmount) * 100;
    categoryPercentageValues[category] = parseFloat(percentage.toFixed(2)); // Round the percentage to 2 decimal places
  });
  
  // Conver month number to string in 01, 02, 03... format
  function formatDateToString(month) {
    let MM = ((month + 1) < 10 ? '0' : '')
        + (month + 1);
    return MM;
  };

  const prevMonth = (month) => {
    if (month === 1) {
      return "12"
    }
    return formatDateToString(month - 2)
  };

  // Percentage difference Year-To-Year
  const monthDiff = (thisYear[formatDateToString(month)] / thisYear[prevMonth(formatDateToString(month))]) * 100 - 100;

  const newestInvoice = invoices[0];

  unPaidInvoices.sort((a, b) => {
    let da = new Date(a.pay_deadline),
        db = new Date(b.pay_deadline);
    return da - db;
  });

  return (
  <>
    <Head>
      <title>
        Overview | Devias Kit
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
              difference={parseFloat(monthDiff.toFixed(2))}
              positive={monthDiff > 0}
              sx={{ height: '100%' }}
              value={parseFloat(thisYear[formatDateToString(date.getMonth())]).toFixed(2)+"zł"}
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
              value={unPaidInvoices[0] ? unPaidInvoices[0].amount + "zł" : "Wszystkie faktury opłacone!"}
              supplier={unPaidInvoices[0] ? unPaidInvoices[0].supplier.name : "---"}
              date={unPaidInvoices[0] ? unPaidInvoices[0].pay_deadline : "---"}
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
                  data: sortedLastYear
                },
                {
                  name: 'This year',
                  data: sortedThisYear
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
              chartSeries={Object.values(categoryPercentageValues)}
              labels={Object.keys(categoryPercentageValues)}
              // labels={categories}
              sx={{ height: '100%' }}
            />
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
