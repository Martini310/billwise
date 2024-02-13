import { useCallback, useState } from 'react';
import Head from 'next/head';
import NextLink from 'next/link';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import { Layout as AuthLayout } from 'src/layouts/auth/layout';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { toast } from 'sonner'



const Page = () => {

  const router = useRouter()
  const [method, setMethod] = useState('email');
  const [isButtonDisabled, setButtonDisabled] = useState(false);
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup
        .string()
        .email('Must be a valid email')
        .max(255)
        .required('Email is required'),
      password: Yup
        .string()
        .max(255)
        .required('Password is required')
    }),

  onSubmit: async (values, helpers) => {
    setButtonDisabled(true);
    console.log('values', values)
    try {
      const response = await signIn('credentials', { ...values,  redirect: false, callbackUrl: process.env.NEXTAUTH_URL});
      console.log('response', response)
      if (response.ok) {
        toast.success('Zalogowano prawidłowo!');
        router.push('/')
      };
      if (response && response.status === 401) {
        console.error('if Sign-in error:', response);
        helpers.setStatus({ success: false });
        helpers.setErrors({ submit: response.message || 'Błąd logowania. Sprawdź poprawność danych i spróbuj ponownie' });
        helpers.setSubmitting(false);
        toast.warning('Błąd logowania!');
        setButtonDisabled(false);
      }
    } catch (err) {
      console.error('catch Sign-in error:', err);
      helpers.setStatus({ success: false });
      helpers.setErrors({ submit: err.message || 'Wystąpił błąd. Spróbuj ponownie' });
      helpers.setSubmitting(false);
      toast.error('Wystąpił błąd! Spróbuj ponownie..');
      setButtonDisabled(false);
    }
  }
  });
  
  const handleMethodChange = useCallback(
    (event, value) => {
      setMethod(value);
    },
    []
  );

  return (
    <>
      <Head>
        <title>
          Zaloguj | Billwise
        </title>
      </Head>
      <Box
        sx={{
          backgroundColor: 'background.paper',
          flex: '1 1 auto',
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Box
          sx={{
            maxWidth: 550,
            px: 3,
            py: '100px',
            width: '100%'
          }}
        >
          <div>
            <Stack
              spacing={1}
              sx={{ mb: 3 }}
            >
              <Typography variant="h4">
                Logowanie
              </Typography>
              <Typography
                color="text.secondary"
                variant="body2"
              >
                Nie masz jeszcze konta?
                &nbsp;
                <Link
                  component={NextLink}
                  href="/auth/register"
                  underline="hover"
                  variant="subtitle2"
                >
                  Zarejestruj się
                </Link>
              </Typography>
            </Stack>
            <Tabs
              onChange={handleMethodChange}
              sx={{ mb: 3 }}
              value={method}
            >
              <Tab
                label="Email"
                value="email"
              />
              <Tab
                label="Numer telefonu"
                value="phoneNumber"
              />
            </Tabs>
            {method === 'email' && (
              <form
                noValidate
                onSubmit={formik.handleSubmit}
              >
                <Stack spacing={3}>
                  <TextField
                    error={!!(formik.touched.email && formik.errors.email)}
                    fullWidth
                    helperText={formik.touched.email && formik.errors.email}
                    label="Email"
                    name="email"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    type="email"
                    value={formik.values.email}
                  />
                  <TextField
                    error={!!(formik.touched.password && formik.errors.password)}
                    fullWidth
                    helperText={formik.touched.password && formik.errors.password}
                    label="Hasło"
                    name="password"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    type="password"
                    value={formik.values.password}
                  />
                </Stack>
                {formik.errors.submit && (
                  <Typography
                    color="error"
                    sx={{ mt: 3 }}
                    variant="body2"
                  >
                    <b>{formik.errors.submit}</b>
                  </Typography>
                )}
                <Button
                  fullWidth
                  size="large"
                  sx={{ mt: 3 }}
                  type="submit"
                  variant="contained"
                  disabled={isButtonDisabled}
                >
                  {isButtonDisabled ? (
                    <>
                      Logowanie <CircularProgress size='21px' sx={{ mt: 0, ml: 2 }} />
                    </>
                    ) : (
                      'Zaloguj'
                  )}                
                </Button>
                <Button
                  fullWidth
                  size="large"
                  sx={{ mt: 3 }}
                  type="button"
                  variant="contained"
                  onClick={() => signIn('google', {callbackUrl: '/'})}
                >
                  Sign in with Google
                </Button>
                <Alert
                  color="primary"
                  severity="info"
                  sx={{ mt: 3 }}
                >
                  <div>
                    You can use <b>test@user.com</b> and password <b>test</b>
                  </div>
                </Alert>
              </form>
            )}
            {method === 'phoneNumber' && (
              <div>
                <Typography
                  sx={{ mb: 1 }}
                  variant="h6"
                >
                  Ta usługa nie jest jeszcze dostępna
                </Typography>
                <Typography color="text.secondary">
                  Pracujemy nad tym, aby uruchomić ją jak najszybciej
                </Typography>
              </div>
            )}
          </div>
        </Box>
      </Box>
    </>
  );
};

Page.getLayout = (page) => (
  <AuthLayout>
    {page}
  </AuthLayout>
);

export default Page;
