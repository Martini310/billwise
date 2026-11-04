import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
  Unstable_Grid2 as Grid
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import axios from 'axios';
import { axiosInstance } from 'src/utils/axios';
import { toast } from 'sonner';
import { formatCurrency } from 'src/utils/format-currency';

const INTERVALS = [
  { value: 1, label: 'co miesiąc' },
  { value: 2, label: 'co 2 miesiące' },
  { value: 3, label: 'co kwartał' },
  { value: 6, label: 'co pół roku' },
  { value: 12, label: 'co rok' },
];

const EMPTY = { name: '', amount: '', amount_variable: false, category: '', group: '', day: 1, interval_months: 1, start_month: '' };

export const RecurringManager = ({ onChanged }) => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = () => axiosInstance.get('recurring/').then((res) => setItems(res.data)).catch(() => {});

  useEffect(() => {
    load();
    axios.all([axiosInstance.get('category/'), axiosInstance.get('groups/')])
      .then(axios.spread((cat, grp) => { setCategories(cat.data); setGroups(grp.data); }))
      .catch(() => {});
  }, []);

  const openNew = () => {
    const now = new Date();
    setForm({ ...EMPTY, start_month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` });
    setOpen(true);
  };

  const change = (event) => {
    const { name, type, value, checked } = event.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const save = () => {
    if (!form.name.trim() || !form.category || !form.start_month || (!form.amount_variable && !form.amount)) {
      toast.error('Uzupełnij nazwę, kategorię i miesiąc początkowy (oraz kwotę dla opłaty o stałej kwocie).');
      return;
    }
    const payload = {
      name: form.name.trim(),
      amount: form.amount ? parseFloat(form.amount) : null,
      amount_variable: !!form.amount_variable,
      category: form.category,
      group: form.group || null,
      day: parseInt(form.day, 10) || 1,
      interval_months: parseInt(form.interval_months, 10) || 1,
      start_date: `${form.start_month}-01`,
    };
    axiosInstance.post('recurring/', payload)
      .then(() => {
        setOpen(false);
        load();
        if (onChanged) onChanged();
        toast.success('Dodano opłatę cykliczną');
      })
      .catch(() => toast.error('Nie udało się zapisać opłaty'));
  };

  const remove = (item) => {
    if (!window.confirm(`Usunąć opłatę ${item.name}? Dotychczas utworzone faktury pozostaną.`)) return;
    axiosInstance.delete(`recurring/${item.id}/`)
      .then(() => { load(); if (onChanged) onChanged(); toast.success('Usunięto opłatę'); })
      .catch(() => toast.error('Nie udało się usunąć opłaty'));
  };

  const intervalLabel = (value) => (INTERVALS.find((i) => i.value === value)?.label ?? `co ${value} mies.`);
  const groupName = (id) => groups.find((g) => g.id === id)?.name;

  return (
    <Card>
      <CardHeader
        title="Opłaty cykliczne"
        subheader="Stałe opłaty spoza dostawców (czynsz, śmieci) — same wpadają na listę faktur jako niezapłacone."
        action={(
          <Button startIcon={<AddIcon />} variant="contained" onClick={openNew}>
            Dodaj opłatę
          </Button>
        )}
      />
      <CardContent sx={{ pt: 0 }}>
        {items.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            Brak opłat cyklicznych.
          </Typography>
        ) : (
          <Stack divider={<Divider />} spacing={0}>
            {items.map((item) => (
              <Stack key={item.id} alignItems="center" direction="row" justifyContent="space-between" sx={{ py: 1 }}>
                <Stack alignItems="center" direction="row" spacing={1.5}>
                  <Box sx={{
                    alignItems: 'center', backgroundColor: 'primary.alpha12', borderRadius: '8px',
                    color: 'primary.main', display: 'flex', height: 32, justifyContent: 'center', width: 32
                  }}>
                    <AutorenewIcon sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">{item.name}</Typography>
                    <Typography color="text.secondary" variant="caption">
                      {item.amount_variable
                        ? `kwota zmienna${item.amount ? ` (~${formatCurrency(item.amount)})` : ''}`
                        : formatCurrency(item.amount)} · {intervalLabel(item.interval_months)} · dzień {item.day}
                      {item.group ? ` · ${groupName(item.group) ?? 'grupa'}` : ''}
                    </Typography>
                  </Box>
                </Stack>
                <IconButton onClick={() => remove(item)} size="small">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nowa opłata cykliczna</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid xs={12} md={8}>
              <TextField fullWidth label="Nazwa (np. Czynsz)" name="name" value={form.name} onChange={change} />
            </Grid>
            <Grid xs={12} md={4}>
              <TextField
                fullWidth
                label={form.amount_variable ? 'Kwota orientacyjna' : 'Kwota'}
                name="amount"
                type="number"
                value={form.amount}
                onChange={change}
                helperText={form.amount_variable ? 'Podpowiedź — wpiszesz realną kwotę co miesiąc' : ' '}
              />
            </Grid>
            <Grid xs={12}>
              <FormControlLabel
                control={<Switch name="amount_variable" checked={form.amount_variable} onChange={change} />}
                label="Kwota zmienna — co miesiąc wpisuję ręcznie (np. kredyt z nadpłatą, żłobek)"
              />
            </Grid>
            <Grid xs={12} md={6}>
              <TextField fullWidth select SelectProps={{ native: true }} label="Kategoria" name="category" value={form.category} onChange={change}>
                <option value=''></option>
                {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </TextField>
            </Grid>
            <Grid xs={12} md={6}>
              <TextField fullWidth select SelectProps={{ native: true }} label="Grupa (opcjonalnie)" name="group" value={form.group} onChange={change}>
                <option value=''>— brak —</option>
                {groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
              </TextField>
            </Grid>
            <Grid xs={6} md={4}>
              <TextField fullWidth label="Dzień miesiąca" name="day" type="number" inputProps={{ min: 1, max: 28 }} value={form.day} onChange={change} />
            </Grid>
            <Grid xs={6} md={4}>
              <TextField fullWidth select SelectProps={{ native: true }} label="Powtarzaj" name="interval_months" value={form.interval_months} onChange={change}>
                {INTERVALS.map((i) => (<option key={i.value} value={i.value}>{i.label}</option>))}
              </TextField>
            </Grid>
            <Grid xs={12} md={4}>
              <TextField fullWidth label="Od miesiąca" name="start_month" type="month" InputLabelProps={{ shrink: true }} value={form.start_month} onChange={change} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setOpen(false)}>Anuluj</Button>
          <Button variant="contained" onClick={save}>Zapisz</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

RecurringManager.propTypes = {
  onChanged: PropTypes.func
};
