import Head from 'next/head';
import { Box, Container, Stack, Typography, Unstable_Grid2 as Grid } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { AccountProfile } from 'src/sections/edit-sup-account/account-profile';
import { AccountProfileDetails } from 'src/sections/edit-sup-account/account-profile-details';
import { useRouter } from 'next/router';


const Page = () => {

  const router = useRouter(); // Use the useRouter hook
  const { accountId } = router.query; // Get the accountId query parameter


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
              {console.log(accountId)}
              Supplier {accountId}
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
                <AccountProfile />
              </Grid>
              <Grid
                xs={12}
                md={6}
                lg={8}
              >
                <AccountProfileDetails />
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
