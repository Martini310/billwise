import Head from 'next/head';
import { Box, Container, Stack, Typography, Unstable_Grid2 as Grid } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { Profile } from 'src/sections/profile/profile';
import { ProfileDetails } from 'src/sections/profile/profile-details';
import { ProfilePassword } from 'src/sections/profile/profile-password';
import { useState, useEffect } from 'react';
import { withComponentLoading } from 'src/utils/componentLoading';
import { axiosInstance } from 'src/utils/axios';

const Page = () => {
  
  const ProfileLoading = withComponentLoading(Profile);
  const ProfileDetailsLoading = withComponentLoading(ProfileDetails);
  
  const [profileDetails, setProfileDetails] = useState();
  const [appState, setAppState] = useState({loading: true});
  
  // Fetch user info
  useEffect(() => {
      axiosInstance
        .get(`user/user-info`)
        .then((res) => {
          setProfileDetails(res.data);
          setAppState({ ...appState, loading: false });
          }
        )
  }, [setProfileDetails]);


  return (
    <>
      <Head>
        <title>
          Mój profil | Billwise
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
                Konto
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
                  <Profile
                    isLoading={appState.loading}
                    user={profileDetails}
                    />
                </Grid>
                <Grid
                  xs={12}
                  md={6}
                  lg={8}
                >
                  <ProfileDetailsLoading
                    isLoading={appState.loading}
                    user={profileDetails}
                  />
                </Grid>
                <Grid
                  xs={12}
                  md={6}
                  lg={12}
                >
                  <ProfilePassword />
                </Grid>
              </Grid>
            </div>
          </Stack>
        </Container>
      </Box>
    </>
  );
}

Page.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;
