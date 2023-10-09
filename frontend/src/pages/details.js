import Head from 'next/head';
import { useState, useEffect } from 'react';
import { Box, Container, Stack, Typography, Unstable_Grid2 as Grid } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { OverviewMonthlyChart } from 'src/sections/overview/overview-monthly-chart';
import { withComponentLoading } from 'src/utils/componentLoading';
import { baseURL, axiosInstance } from 'src/utils/axios';

// Function to fetch invoices
async function fetchInvoices() {
  try {
    const response = await axiosInstance.get(baseURL + 'invoices/', {
      headers: { 'Authorization': 'JWT ' + localStorage.getItem('access_token') }
    });
    return response.data;
  } catch (error) {
    // Handle the error here, e.g., display an error message.
    console.error('Error fetching invoices:', error);
    return [];
  }
}

function calculateMonthlyAmounts(invoices) {
  const date = new Date();
  const currentYear = date.getFullYear();
  const monthNames = ['01','02','03','04','05','06','07','08','09','10','11','12'];

  const monthlyAmounts = {};

  invoices.forEach((invoice) => {
    const account = invoice.account.supplier.name;
    const invoiceDate = new Date(invoice.date);
    const invoiceYear = invoiceDate.getFullYear();
    const invoiceMonth = monthNames[invoiceDate.getMonth()];

    // Initialize the account's data if not present
    if (!monthlyAmounts[account]) {
      monthlyAmounts[account] = {
        thisYear: Object.fromEntries(monthNames.map((month) => [month, 0])),
        lastYear: Object.fromEntries(monthNames.map((month) => [month, 0])),
      };
    }

    // Check if the invoice is from the current or last year and update accordingly
    if (invoiceYear === currentYear) {
      monthlyAmounts[account].thisYear[invoiceMonth] += parseFloat(invoice.amount).toFixed(2);
    } else if (invoiceYear === currentYear - 1) {
      monthlyAmounts[account].lastYear[invoiceMonth] += parseFloat(invoice.amount).toFixed(2);
    }
  });

  return monthlyAmounts;
}


const Page = () => {

  const [invoices, setInvoices] = useState([])
  // const [categories, setCategories] = useState([])

  const MonthlyChartLoading = withComponentLoading(OverviewMonthlyChart);
  const [appState, setAppState] = useState({
      loading: true,
      chartSeries: null,
      sx: null
  });

  // Fetch invoices and categories
  useEffect(() => {
    fetchInvoices()
      .then((data) => {
        setInvoices(data);
        setAppState({...appState, loading:false});
      })
  }, []);

  // Process the invoices to calculate monthly amounts
  const sortedAccounts = calculateMonthlyAmounts(invoices);

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
