import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import SmsIcon from '@mui/icons-material/Sms';
import { axiosInstance } from 'src/utils/axios';
import { toast } from 'sonner';

// Konfiguracja zaufanego urządzenia Orange bez shella: start wysyła SMS,
// weryfikacja kodu zapisuje token na koncie.
export const OrangeSetupDialog = ({ account, onConfigured }) => {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | starting | code | verifying
  const [code, setCode] = useState('');

  const busy = phase === 'starting' || phase === 'verifying';

  const start = () => {
    setOpen(true);
    setCode('');
    setPhase('starting');
    axiosInstance.post('orange-setup/start/', { account_id: account.id })
      .then((res) => {
        if (res.data.status === 'completed') {
          toast.success('Orange skonfigurowane — token zapisany.');
          setOpen(false);
          setPhase('idle');
          if (onConfigured) onConfigured();
        } else {
          setPhase('code');
          toast.info('Wysłaliśmy kod SMS na Twój numer Orange.');
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Nie udało się rozpocząć konfiguracji.');
        setOpen(false);
        setPhase('idle');
      });
  };

  const verify = () => {
    if (!code.trim()) { toast.error('Podaj kod SMS.'); return; }
    setPhase('verifying');
    axiosInstance.post('orange-setup/verify/', { account_id: account.id, code: code.trim() })
      .then(() => {
        toast.success('Zaufane urządzenie zarejestrowane — koniec z SMS-ami.');
        setOpen(false);
        setPhase('idle');
        if (onConfigured) onConfigured();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Weryfikacja nie powiodła się.');
        setPhase('code'); // pozwól spróbować ponownie
      });
  };

  return (
    <>
      <Button size="small" variant="outlined" color="warning" startIcon={<SmsIcon />} onClick={start}>
        Skonfiguruj (SMS)
      </Button>
      <Dialog open={open} onClose={() => { if (!busy) setOpen(false); }} fullWidth maxWidth="xs">
        <DialogTitle>Konfiguracja Orange</DialogTitle>
        <DialogContent>
          {phase === 'starting' ? (
            <Stack alignItems="center" spacing={2} sx={{ py: 3 }}>
              <CircularProgress size={28} />
              <Typography color="text.secondary" variant="body2">Logowanie i wysyłka SMS…</Typography>
            </Stack>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography color="text.secondary" variant="body2">
                Wpisz kod SMS wysłany przez Orange, aby zarejestrować to urządzenie jako zaufane
                (kolejne synchronizacje będą już bez SMS).
              </Typography>
              <TextField
                autoFocus
                label="Kod SMS"
                value={code}
                disabled={phase === 'verifying'}
                inputProps={{ inputMode: 'numeric' }}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') verify(); }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="inherit" disabled={busy} onClick={() => setOpen(false)}>Anuluj</Button>
          <Button variant="contained" disabled={phase !== 'code'} onClick={verify}>
            {phase === 'verifying' ? 'Weryfikuję…' : 'Zatwierdź'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

OrangeSetupDialog.propTypes = {
  account: PropTypes.object.isRequired,
  onConfigured: PropTypes.func
};
