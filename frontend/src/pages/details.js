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
  console.log(sortedLastYear)
  return (  
    <>
        <Head>
        <title>
            Account | Devias Kit
        </title>
        </Head>

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
                sync=''
                />

    </>
  )
};

Page.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;
