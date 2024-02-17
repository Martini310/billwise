import { useCallback } from 'react';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Checkbox,
  Divider,
  FormControlLabel,
  Stack,
  Typography,
  Unstable_Grid2 as Grid
} from '@mui/material';

export const SettingsNotifications = () => {
  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
    },
    []
  );

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader
          subheader="Dostępne wkrótce"
          title="Notifications"
        />
        <Divider />
        <CardContent>
          <Grid
            container
            spacing={6}
            wrap="wrap"
          >
            <Grid
              xs={12}
              sm={6}
              md={4}
            >
              <Stack spacing={1}>
                <Typography variant="h6">
                  Notifications
                </Typography>
                <Stack>
                  <FormControlLabel
                    disabled='true'
                    control={<Checkbox defaultChecked />}
                    label="Email"
                  />
                  <FormControlLabel
                    disabled='true'
                    control={<Checkbox defaultChecked />}
                    label="Push Notifications"
                  />
                  <FormControlLabel
                    disabled='true'
                    control={<Checkbox />}
                    label="Text Messages"
                  />
                  <FormControlLabel
                    disabled='true'
                    control={<Checkbox defaultChecked />}
                    label="Phone calls"
                  />
                </Stack>
              </Stack>
            </Grid>
            <Grid
              item
              md={4}
              sm={6}
              xs={12}
            >
              <Stack spacing={1}>
                <Typography variant="h6">
                  Messages
                </Typography>
                <Stack>
                  <FormControlLabel
                    disabled='true'
                    control={<Checkbox defaultChecked />}
                    label="Email"
                  />
                  <FormControlLabel
                    disabled='true'
                    control={<Checkbox />}
                    label="Push Notifications"
                  />
                  <FormControlLabel
                    disabled='true'
                    control={<Checkbox defaultChecked />}
                    label="Phone calls"
                  />
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button variant="contained">
            Save
          </Button>
        </CardActions>
      </Card>
    </form>
  );
};
