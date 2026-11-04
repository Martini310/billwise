// Jedna, spójna tożsamość wizualna dla każdej kategorii rachunku (ikona + kolor),
// używana w wykresie kołowym, legendzie, chipach w tabeli i kartach kont — dzięki
// czemu "Prąd" wygląda tak samo wszędzie w aplikacji.
import BoltIcon from '@mui/icons-material/Bolt';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import WifiIcon from '@mui/icons-material/Wifi';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import TvIcon from '@mui/icons-material/Tv';
import CellTowerIcon from '@mui/icons-material/CellTower';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SchoolIcon from '@mui/icons-material/School';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ApartmentIcon from '@mui/icons-material/Apartment';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';

export const CATEGORY_META = {
  'Prąd':             { color: '#EAB308', Icon: BoltIcon },
  'Gaz':              { color: '#F79009', Icon: LocalFireDepartmentIcon },
  'Woda':             { color: '#0EA5E9', Icon: WaterDropIcon },
  'Paliwo':           { color: '#10B981', Icon: LocalGasStationIcon },
  'Internet':         { color: '#6366F1', Icon: WifiIcon },
  'Telefon':          { color: '#14B8A6', Icon: SmartphoneIcon },
  'Telewizja':        { color: '#8B5CF6', Icon: TvIcon },
  'Telekomunikacja':  { color: '#EC4899', Icon: CellTowerIcon },
  'Przedszkole':      { color: '#F43F5E', Icon: SchoolIcon },
  'Śmieci':           { color: '#84CC16', Icon: DeleteOutlineIcon },
  'Wspólnota':        { color: '#0D9488', Icon: ApartmentIcon },
  'Leasing':          { color: '#A855F7', Icon: DirectionsCarIcon },
  'Inne':             { color: '#64748B', Icon: ReceiptLongIcon },
};

export const DEFAULT_CATEGORY_META = CATEGORY_META['Inne'];

export const getCategoryMeta = (name) => CATEGORY_META[name] || DEFAULT_CATEGORY_META;

// Kolory w kolejności podanych etykiet — dla wykresów (apexcharts).
export const categoryColors = (labels = []) => labels.map((label) => getCategoryMeta(label).color);
