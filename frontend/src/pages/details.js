import Head from 'next/head';
import { useState, useEffect } from 'react';
import { Box, Container, Stack, Typography, Unstable_Grid2 as Grid } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { OverviewMonthlyChart } from 'src/sections/overview/overview-monthly-chart';
import { withComponentLoading } from 'src/utils/componentLoading';
import { baseURL, axiosInstance } from 'src/utils/axios';


const Page = () => {

  const [invoices, setInvoices] = useState([])
  const [categories, setCategories] = useState([])

  const MonthlyChartLoading = withComponentLoading(OverviewMonthlyChart);
  const [appState, setAppState] = useState({
      loading: true,
      chartSeries: null,
      sx: null
  });

  // Fetch invoices and sort them by date
  useEffect(() => {
    axiosInstance
      .get(
        baseURL + 'invoices/',
        { 'headers': { 'Authorization': 'JWT ' + localStorage.getItem('access_token'), }})
      .then((res) => {
        const allInvoices = res.data;
        allInvoices.sort((a, b) => {
          let da = new Date(a.date),
              db = new Date(b.date);
          return db - da;
        });
        setInvoices(allInvoices);
        setAppState({...appState, loading:false})
        }
      )
  }, [setInvoices, baseURL]);

  // Fetch Categories and create array with category names
  useEffect(() => {
    axiosInstance.get(baseURL + 'category/')
      .then((res) => {
        const categories = res.data;
        let categoryNames = [];
        categories.forEach((category) => 
          categoryNames.push(category.name))
        setCategories(categoryNames);
    });
  }, [setCategories, baseURL]);

  const date = new Date();
  const year = date.getFullYear();

  let sortedAccounts = {}

  invoices.forEach((invoice) => {
    const account = invoice.account.supplier.name;
    const month = invoice.date.slice(5, 7);

    if (!sortedAccounts[account]) {
      sortedAccounts[account] = {
        'thisYear': {'01':0, '02':0, '03':0, '04':0, '05':0, '06':0, '07':0, '08':0, '09':0, '10':0, '11':0, '12':0},
        'lastYear': {'01':0, '02':0, '03':0, '04':0, '05':0, '06':0, '07':0, '08':0, '09':0, '10':0, '11':0, '12':0}}
    }

    if (invoice.date.startsWith(year)) {
      sortedAccounts[account]['thisYear'][month] = (sortedAccounts[account]['thisYear'][month] || 0) + parseFloat((invoice.amount).toFixed(2));
    } else if (invoice.date.startsWith(year - 1)) {
      sortedAccounts[account]['lastYear'][month] = (sortedAccounts[account]['lastYear'][month] || 0) + parseFloat((invoice.amount).toFixed(2));
    }
  })

  console.log(sortedAccounts)
  return (  
    <>
      <Head>
      <title>
          Szczegóły | BillWise
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
          <Grid container spacing={3}>
            {Object.keys(sortedAccounts).map((accountName) => {
              const value = sortedAccounts[accountName];

              return (
                <Grid item xs={12} sm={6} lg={6} key={accountName}>
                  <MonthlyChartLoading
                    isLoading={appState.loading}
                    chartSeries={[
                      {
                        name: 'Last year',
                        data: Object.keys(value.lastYear)
                                .sort((a, b) => parseInt(a) - parseInt(b))
                                .map((key) => value.lastYear[key])
                      },
                      {
                        name: 'This year',
                        data: Object.keys(value.thisYear)
                                .sort((a, b) => parseInt(a) - parseInt(b))
                                .map((key) => value.thisYear[key])
                      }
                    ]}
                    sx={{ height: '100%' }}
                    // sync=''
                    title={accountName}
                  />
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>
    </>
  )
}


Page.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;
