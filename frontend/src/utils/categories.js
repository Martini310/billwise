// Jedna, spójna tożsamość wizualna dla każdej kategorii rachunku (ikona + kolor),
// używana w wykresie kołowym, legendzie, chipach w tabeli i kartach kont — dzięki
// czemu "Prąd" wygląda tak samo wszędzie w aplikacji.
import BoltIcon from '@mui/icons-material/Bolt';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import WifiIcon from '@mui/icons-material/Wifi';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

export const CATEGORY_META = {
  'Prąd':     { color: '#EAB308', Icon: BoltIcon },
  'Gaz':      { color: '#F79009', Icon: LocalFireDepartmentIcon },
  'Woda':     { color: '#0EA5E9', Icon: WaterDropIcon },
  'Paliwo':   { color: '#10B981', Icon: LocalGasStationIcon },
  'Internet': { color: '#6366F1', Icon: WifiIcon },
  'Inne':     { color: '#64748B', Icon: ReceiptLongIcon },
};

export const DEFAULT_CATEGORY_META = CATEGORY_META['Inne'];

export const getCategoryMeta = (name) => CATEGORY_META[name] || DEFAULT_CATEGORY_META;

// Kolory w kolejności podanych etykiet — dla wykresów (apexcharts).
export const categoryColors = (labels = []) => labels.map((label) => getCategoryMeta(label).color);
