import Head from 'next/head';
import { CacheProvider } from '@emotion/react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useNProgress } from 'src/hooks/use-nprogress';
import { createTheme } from 'src/theme';
import { createEmotionCache } from 'src/utils/create-emotion-cache';
import { SessionProvider } from "next-auth/react";
import 'simplebar-react/dist/simplebar.min.css';
import { Toaster } from 'sonner'


const clientSideEmotionCache = createEmotionCache();


const App = (props) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  useNProgress();

  const getLayout = Component.getLayout ?? ((page) => page);

  const theme = createTheme();

  return (
    <SessionProvider session={pageProps.session}>
      <CacheProvider value={emotionCache}>
        <Head>
          <title>
            Devias Kit
          </title>
          <meta
            name="viewport"
            content="initial-scale=1, width=device-width"
            />
        </Head>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Toaster richColors position="top-center" duration='6000' />
              {getLayout(<Component {...pageProps} />)}
            </ThemeProvider>
        </LocalizationProvider>
      </CacheProvider>
    </SessionProvider>
  );
};

export default App;
