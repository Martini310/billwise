import Head from 'next/head';
import NextLink from 'next/link';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { Layout as AuthLayout } from 'src/layouts/auth/layout';
import { axiosInstance } from 'src/utils/axios';
import { useRouter } from 'next/router';
import { toast } from 'sonner'


const Page = () => {
  const router = useRouter()

  const formik = useFormik({
    initialValues: {
      email: '',
      name: '',
      username: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup
        .string()
        .email('Must be a valid email')
        .max(255)
        .required('Email is required'),
      name: Yup
        .string()
        .max(255)
        .required('Name is required'),
      username: Yup
        .string()
        .max(255)
        .required('Userame is required'),
      password: Yup
        .string()
        .max(255)
        .required('Password is required')
      }),
      
      onSubmit: async (values, helpers) => {
        const { email, name, username, password } = values
        try {
          const response = await axiosInstance.post(`user/register/`, {
            email: email,
            username: username,
            first_name: name,
            password: password,
          });
          if (response.status === 201) {
            router.push('/auth/login');
            toast.success('Prawidłowo utworzono nowe konto! Możesz się zalogować.');
          } else {
              console.error('Some error');
              toast.error("Coś poszło nie tak, spróbuj ponownie")
          }
        } catch (error) {
          console.error('Registration failed:', error);
          helpers.setStatus({ success: false });
          Object.keys(error.response.data).forEach(field => {
            helpers.setErrors({ [field]: error.response.data[field] });
          });
          helpers.setSubmitting(false);
        }
    }
  });

  return (
    <>
      <Head>
        <title>
          Zarejestruj się | BillWise
        </title>
      </Head>
      <Box
        sx={{
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
                Rejestracja
              </Typography>
              <Typography
                color="text.secondary"
                variant="body2"
              >
                Masz już konto?
                &nbsp;
                <Link
                  component={NextLink}
                  href="/auth/login"
                  underline="hover"
                  variant="subtitle2"
                >
                  Zaloguj się
                </Link>
              </Typography>
            </Stack>
            <form
              noValidate
              onSubmit={formik.handleSubmit}
            >
              <Stack spacing={3}>
                <TextField
                  error={!!(formik.touched.name && formik.errors.name)}
                  fullWidth
                  helperText={formik.touched.name && formik.errors.name}
                  label="Imię"
                  name="name"
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  value={formik.values.name}
                />
                <TextField
                  error={!!(formik.touched.username && formik.errors.username)}
                  fullWidth
                  helperText={formik.touched.username && formik.errors.username}
                  label="Nazwa użytkownika"
                  name="username"
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  value={formik.values.username}
                />
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
              >
                Utwórz konto
              </Button>
            </form>
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
