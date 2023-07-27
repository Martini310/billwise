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
// import axios from 'axios';

const now = new Date();


const Page = () => {

  const [invoices, setInvoices] = useState([])
  const [categories, setCategories] = useState([])
  const apiUrl = `http://127.0.0.1:8000/api/`;
  
  useEffect(() => {
    // console.log(localStorage.getItem('access_token'))
    axiosInstance.get(apiUrl + 'invoices/')
      .then((res) => {
        const allInvoices = res.data;
        setInvoices(allInvoices);
    });
  }, [setInvoices, apiUrl]);

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

  invoices.forEach((invoice) => {
    if (invoice.date.startsWith("2023")) {
      const month = invoice.date.slice(5, 7);
      thisYear[month] = (thisYear[month] || 0) + invoice.amount;
    } else {
      const month = invoice.date.slice(5, 7);
      lastYear[month] = (lastYear[month] || 0) + invoice.amount;
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

  invoices.forEach((invoice) => {
    categoryTotalAmount[invoice.supplier.media.name] += invoice.amount;
    totalAmount += invoice.amount;
  })

  const categoryPercentageValues = {};
  categories.forEach((category) => {
    const categoryAmount = categoryTotalAmount[category];
    const percentage = (categoryAmount / totalAmount) * 100;
    categoryPercentageValues[category] = parseFloat(percentage.toFixed(2)); // Round the percentage to 2 decimal places
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
              difference={12}
              positive
              sx={{ height: '100%' }}
              value="$24k"
            />
          </Grid>
          <Grid
            xs={12}
            sm={6}
            lg={3}
          >
            <OverviewTotalCustomers
              difference={16}
              positive={false}
              sx={{ height: '100%' }}
              value="1.6k"
            />
          </Grid>
          <Grid
            xs={12}
            sm={6}
            lg={3}
          >
            <OverviewTasksProgress
              sx={{ height: '100%' }}
              value={75.5}
            />
          </Grid>
          <Grid
            xs={12}
            sm={6}
            lg={3}
          >
            <OverviewTotalProfit
              sx={{ height: '100%' }}
              value="$15k"
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
