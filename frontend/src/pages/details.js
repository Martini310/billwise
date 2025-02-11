import Head from 'next/head';
import { useState, useEffect } from 'react';
import { Box, Container, ToggleButton, ToggleButtonGroup, Unstable_Grid2 as Grid } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { OverviewMonthlyChart } from 'src/sections/overview/overview-monthly-chart';
import { axiosInstance } from 'src/utils/axios';
import LinearProgress from '@mui/material/LinearProgress';


// Function to fetch invoices
async function fetchInvoices() {
  try {
    const response = await axiosInstance.get('invoices/');
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

  const monthlyAmounts = {'categories': {}, 'accounts': {}};

  invoices.forEach((invoice) => {
    const account = invoice?.account?.supplier?.name ?? 'Inne';
    const category = invoice.category.name;
    const invoiceDate = new Date(invoice.date);
    const invoiceYear = invoiceDate.getFullYear();
    const invoiceMonth = monthNames[invoiceDate.getMonth()];

    // ACCOUNTS
    // Initialize the account's data if not present
    if (!monthlyAmounts.accounts[account]) {
      monthlyAmounts.accounts[account] = {
        thisYear: Object.fromEntries(monthNames.map((month) => [month, 0])),
        lastYear: Object.fromEntries(monthNames.map((month) => [month, 0])),
      };
    }

    // Check if the invoice is from the current or last year and update accordingly
    if (invoiceYear === currentYear) {
      monthlyAmounts.accounts[account].thisYear[invoiceMonth] += parseFloat(invoice.amount).toFixed(2);
    } else if (invoiceYear === currentYear - 1) {
      monthlyAmounts.accounts[account].lastYear[invoiceMonth] += parseFloat(invoice.amount).toFixed(2);
    }

    // CATEGORIES
    // Initialize the account's data if not present
    if (!monthlyAmounts.categories[category]) {
      monthlyAmounts.categories[category] = {
        thisYear: Object.fromEntries(monthNames.map((month) => [month, 0])),
        lastYear: Object.fromEntries(monthNames.map((month) => [month, 0])),
      };
    }

    // Check if the invoice is from the current or last year and update accordingly
    if (invoiceYear === currentYear) {
      monthlyAmounts.categories[category].thisYear[invoiceMonth] += parseFloat(invoice.amount).toFixed(2);
    } else if (invoiceYear === currentYear - 1) {
      monthlyAmounts.categories[category].lastYear[invoiceMonth] += parseFloat(invoice.amount).toFixed(2);
    }
  });

  return monthlyAmounts;
}


const Page = () => {

  const [invoices, setInvoices] = useState([])

  const [dataBy, setDataBy] = useState('accounts'); // Initially display data by accounts

  const handleDataToggle = (event, newAlignment) => {
    setDataBy(newAlignment);
  };

  // const MonthlyChartLoading = withComponentLoading(OverviewMonthlyChart);
  const MonthlyChartLoading = OverviewMonthlyChart;
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
          <ToggleButtonGroup
            color='info'
            value={dataBy}
            exclusive
            onChange={handleDataToggle}
            aria-label="Show by"
          >
            <ToggleButton value="accounts">Accounts</ToggleButton>
            <ToggleButton value="categories">Categories</ToggleButton>
          </ToggleButtonGroup>
          {appState.loading ? (
            <Box sx={{ py: 3 }}>
              <LinearProgress />
            </Box>
            ) : (
            <Grid container spacing={3}>
              {Object.keys(sortedAccounts[dataBy]).map((accountName) => {
                const value = sortedAccounts[dataBy][accountName];

                return (
                  <Grid item xs={12} sm={6} lg={6} key={accountName}>
                    <MonthlyChartLoading
                      isLoading={appState.loading}
                      chartSeries={[
                        {
                          name: '2 years ago',
                          data: new Array(12).fill(0)
                        },
                        {
                          name: 'Previous year',
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
                      title={accountName}
                    />
                  </Grid>
                );
              })}
            </Grid>
          )}
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
