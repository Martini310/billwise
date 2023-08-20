import Head from 'next/head';
import { Box, Container, Stack, Typography, Unstable_Grid2 as Grid } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { AccountProfile } from 'src/sections/edit-sup-account/account-profile';
import { AccountProfileDetails } from 'src/sections/edit-sup-account/account-profile-details';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { axiosInstance } from 'src/utils/axios';



const Page = () => {

  const router = useRouter(); // Use the useRouter hook
  const { accountId } = router.query; // Get the accountId query parameter

  const [account, setAccount] = useState(null)
  const apiUrl = `http://127.0.0.1:8000/api/`;
  
  const [categories, setCategories] = useState([])

  // Fetch user accounts
  useEffect(() => {
      axiosInstance
        .get(
          apiUrl + 'accounts/' + accountId,
          { 'headers': { 'Authorization': 'JWT ' + localStorage.getItem('access_token'), }})
        .then((res) => {
          setAccount(res.data);
        })
        .catch((error) => {
          console.error(error);
        });
  }, [setAccount, apiUrl]);

  // Fetch Categories and create array with category names
  useEffect(() => {
    axiosInstance.get(apiUrl + 'category/')
      .then((res) => {
        const categories = res.data;
        let categoryNames = [];
        categories.forEach((category) => 
          categoryNames.push(category.name))
        // setCategories(categoryNames);
        setCategories(categories);
    });
  }, [setCategories, apiUrl]);

  return (
  <>
    <Head>
      <title>
        Account | Devias Kit
      </title>
    </Head>
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 8
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <div>
            <Typography variant="h4">
              Dostawca
            </Typography>
          </div>
          <div>
            <Grid
              container
              spacing={3}
            >
              <Grid
                xs={12}
                md={6}
                lg={4}
              >
                <AccountProfile account={account} />
              </Grid>
              <Grid
                xs={12}
                md={6}
                lg={8}
              >
                <AccountProfileDetails account={account} categories={categories} />
              </Grid>
            </Grid>
          </div>
        </Stack>
      </Container>
    </Box>
  </>
  )
}  ;

Page.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;
