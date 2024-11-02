import Head from 'next/head';
import ArrowUpOnSquareIcon from '@heroicons/react/24/solid/ArrowUpOnSquareIcon';
import ArrowDownOnSquareIcon from '@heroicons/react/24/solid/ArrowDownOnSquareIcon';
import PlusIcon from '@heroicons/react/24/solid/PlusIcon';
import PlaylistAddRoundedIcon from '@mui/icons-material/PlaylistAddRounded';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Link,
  Stack,
  SvgIcon,
  Typography,
  Unstable_Grid2 as Grid
} from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { AccountCard } from 'src/sections/accounts/account-card';
import { AccountsSearch } from 'src/sections/accounts/accounts-search';
import { axiosInstance } from 'src/utils/axios';
import { useState, useEffect } from 'react';
import { sizeHeight } from '@mui/system';


const Page = () => {

  const [accounts, setAccounts] = useState([])
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user accounts
  useEffect(() => {
      axiosInstance
        .get('accounts/')
        .then((res) => {
          setAccounts(res.data);
        })
  }, []);

  // Filter accounts based on search query
  const filteredAccounts = accounts.filter((account) =>
    account.supplier['name'].toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
  <>
    <Head>
      <title>
        Dostawcy | Billwise
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
        <Stack spacing={3}>
          <Stack
            direction="row"
            justifyContent="space-between"
            spacing={4}
          >
            <Stack spacing={1}>
              <Typography variant="h4">
                Moi dostawcy
              </Typography>
            </Stack>
            <div>
              <Button
                href='new-account/'
                startIcon={(
                  <SvgIcon fontSize="small">
                    <PlusIcon />
                  </SvgIcon>
                )}
                variant="contained"
              >
                Dodaj
              </Button>
            </div>
          </Stack>
          <AccountsSearch onSearch={setSearchQuery}/>
          <Grid
            container
            spacing={3}
          >
            {filteredAccounts.map((account) => (
              <Grid
                xs={12}
                md={6}
                lg={4}
                key={account.id}
              >
                <AccountCard account={account} />
              </Grid>
            ))}
            <Grid
              xs={12}
              md={6}
              lg={4}
              key={8}
            >
              <Link href='new-account/'>
                <Card
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    backgroundColor: '#6366F1',
                    '&:hover': {
                      backgroundColor: '#4C4FD2',
                    }
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        pb: 0
                      }}
                    >
                      <PlaylistAddRoundedIcon sx={{fontSize: '210px', color: '#FFF'}}/>
                    </Box>
                    <Typography
                      align="center"
                      gutterBottom
                      variant="h5"
                      color='#FFF'
                      >
                      Dodaj konto
                    </Typography>
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          </Grid>
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


