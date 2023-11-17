import Head from 'next/head';
import { Box, Container, Stack, Typography, Unstable_Grid2 as Grid } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { AccountProfile } from 'src/sections/edit-account/account-profile';
import { AccountProfileDetails } from 'src/sections/edit-account/account-profile-details';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { axiosInstance } from 'src/utils/axios';
import axios from 'axios';


const Page = () => {

  const router = useRouter();
  const { accountId } = router.query; // Get the accountId query parameter

  const [account, setAccount] = useState(null)

  const [categories, setCategories] = useState([])

  // Fetch user accounts
  useEffect(() => {
    axios.all([
      axiosInstance.get('accounts/' + accountId),
      axiosInstance.get('category/')
    ])
    .then(axios.spread((accountsResponse, categoriesResponse) => {
      setAccount(accountsResponse.data);
      setCategories(categoriesResponse.data);
    }))
  }, []
  )


  return (
  <>
    <Head>
      <title>
        Edycja konta | Billwise
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
};

Page.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;
