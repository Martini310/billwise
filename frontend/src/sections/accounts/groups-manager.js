import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { axiosInstance } from 'src/utils/axios';
import { toast } from 'sonner';
import { GROUP_COLORS, DEFAULT_GROUP_COLOR } from 'src/utils/group-colors';

export const GroupsManager = ({ onChanged }) => {
  const [groups, setGroups] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_GROUP_COLOR);

  const load = () => axiosInstance.get('groups/').then((res) => setGroups(res.data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setName(''); setColor(DEFAULT_GROUP_COLOR); setOpen(true); };
  const openEdit = (group) => { setEditing(group); setName(group.name); setColor(group.color); setOpen(true); };

  const save = () => {
    if (!name.trim()) return;
    const payload = { name: name.trim(), color };
    const request = editing
      ? axiosInstance.patch(`groups/${editing.id}/`, payload)
      : axiosInstance.post('groups/', payload);
    request
      .then(() => {
        setOpen(false);
        load();
        if (onChanged) onChanged();
        toast.success(editing ? 'Zapisano grupę' : 'Dodano grupę');
      })
      .catch(() => toast.error('Nie udało się zapisać grupy'));
  };

  const remove = (group) => {
    if (!window.confirm(`Usunąć grupę „${group.name}"? Konta pozostaną — stracą tylko przypisanie do grupy.`)) return;
    axiosInstance.delete(`groups/${group.id}/`)
      .then(() => {
        load();
        if (onChanged) onChanged();
        toast.success('Usunięto grupę');
      })
      .catch(() => toast.error('Nie udało się usunąć grupy'));
  };

  return (
    <Card>
      <CardHeader
        title="Grupy"
        subheader="Przypisuj dostawców do zbiorów (np. Dom 1 / Dom 2), żeby widzieć opłaty osobno."
        action={(
          <Button startIcon={<AddIcon />} variant="contained" onClick={openNew}>
            Dodaj grupę
          </Button>
        )}
      />
      <CardContent sx={{ pt: 0 }}>
        {groups.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            Brak grup. Utwórz grupę, a potem przypisz do niej dostawców przy dodawaniu/edycji konta.
          </Typography>
        ) : (
          <Stack direction="row" flexWrap="wrap" sx={{ gap: 1 }}>
            {groups.map((group) => (
              <Chip
                key={group.id}
                label={group.name}
                onClick={() => openEdit(group)}
                onDelete={() => remove(group)}
                deleteIcon={<DeleteIcon />}
                sx={{
                  backgroundColor: alpha(group.color, 0.12),
                  color: group.color,
                  fontWeight: 600,
                  '& .MuiChip-deleteIcon': { color: group.color, '&:hover': { color: group.color } }
                }}
              />
            ))}
          </Stack>
        )}
      </CardContent>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editing ? 'Edytuj grupę' : 'Nowa grupa'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nazwa grupy"
            value={name}
            onChange={(event) => setName(event.target.value)}
            sx={{ mt: 1 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
            Kolor
          </Typography>
          <Stack direction="row" flexWrap="wrap" sx={{ gap: 1 }}>
            {GROUP_COLORS.map((swatch) => (
              <Box
                key={swatch}
                onClick={() => setColor(swatch)}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: swatch,
                  cursor: 'pointer',
                  border: '3px solid',
                  borderColor: color === swatch ? 'text.primary' : 'transparent'
                }}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setOpen(false)}>Anuluj</Button>
          <Button variant="contained" onClick={save}>Zapisz</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

GroupsManager.propTypes = {
  onChanged: PropTypes.func
};
