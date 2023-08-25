import Head from 'next/head';
import { subDays, subHours } from 'date-fns';
import { Box, Container, Unstable_Grid2 as Grid } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { OverviewBudget } from 'src/sections/overview/overview-budget';
import { OverviewLatestOrders } from 'src/sections/overview/overview-latest-orders';
import { OverviewSales } from 'src/sections/overview/overview-sales';
import { OverviewTasksProgress } from 'src/sections/overview/overview-tasks-progress';
import { OverviewTotalCustomers } from 'src/sections/overview/overview-total-customers';
import { OverviewTotalProfit } from 'src/sections/overview/overview-total-profit';
import { OverviewTraffic } from 'src/sections/overview/overview-traffic';
import { useState, useEffect } from 'react';
import { axiosInstance } from 'src/utils/axios';


const now = new Date();


const Page = () => {

  const [invoices, setInvoices] = useState([])
  const [categories, setCategories] = useState([])
  const apiUrl = `http://127.0.0.1:8000/api/`;
  
  // Fetch invoices and sort them by date
  useEffect(() => {
      axiosInstance
        .get(
          apiUrl + 'invoices/',
          { 'headers': { 'Authorization': 'JWT ' + localStorage.getItem('access_token'), }})
        .then((res) => {
          const allInvoices = res.data;
          allInvoices.sort((a, b) => {
            let da = new Date(a.date),
                db = new Date(b.date);
            return db - da;
          });
          setInvoices(allInvoices);
          }
        )
  }, [setInvoices, apiUrl]);

  // Fetch Categories and create array with category names
  useEffect(() => {
    axiosInstance.get(apiUrl + 'category/')
      .then((res) => {
        const categories = res.data;
        let categoryNames = [];
        categories.forEach((category) => 
          categoryNames.push(category.name))
        setCategories(categoryNames);
    });
  }, [setCategories, apiUrl]);

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

  const categoryTotalAmount = {};
  let totalAmount = 0;

  categories.forEach(category => {
    categoryTotalAmount[category] = 0;
  });

  let paidInvoices = 0;
  let unPaidInvoices = []

  // Sum invoices amounts by categories and count paid an unpaid invoices
  invoices.forEach((invoice) => {
    categoryTotalAmount[invoice.account.category.name] += invoice.amount;
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
            <OverviewBudget
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
            <OverviewTotalCustomers
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
            <OverviewTasksProgress
              sx={{ height: '100%' }}
              value={parseFloat((paidInvoices / invoices.length * 100).toFixed(0))}
            />
          </Grid>
          <Grid
            xs={12}
            sm={6}
            lg={3}
          >
            <OverviewTotalProfit
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
            <OverviewSales
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
            />
          </Grid>
          <Grid
            xs={12}
            md={6}
            lg={4}
          >
            <OverviewTraffic
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
            <OverviewLatestOrders
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
