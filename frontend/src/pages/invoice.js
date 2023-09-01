import Head from 'next/head';
import { Box, Container, Stack, Typography } from '@mui/material';
import { InvoiceNotifications } from 'src/sections/invoice/invoice-notifications';
import { InvoiceForm } from 'src/sections/invoice/invoice-form';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';

const Page = () => (
  <>
    <Head>
      <title>
        Dodaj płatność | Billwise
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
          <Typography variant="h4">
            Dodaj płatność
          </Typography>
          <InvoiceForm />
          <InvoiceNotifications />
        </Stack>
      </Container>
    </Box>
  </>
);

Page.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;
