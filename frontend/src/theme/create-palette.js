import { common } from '@mui/material/colors';
import { alpha } from '@mui/material/styles';
import { error, indigo, info, neutral, purple, success, warning } from './colors';

export function createPalette() {
  return {
    action: {
      active: neutral[500],
      disabled: alpha(neutral[900], 0.38),
      disabledBackground: alpha(neutral[900], 0.12),
      focus: alpha(neutral[900], 0.16),
      hover: alpha(neutral[900], 0.08),
      selected: alpha(neutral[900], 0.12)
    },
    background: {
      default: neutral[50],
      paper: common.white
    },
    divider: '#E6E8F0',
    error,
    info,
    mode: 'light',
    neutral,
    primary: indigo,
    secondary: purple,
    success,
    text: {
      primary: neutral[900],
      secondary: neutral[500],
      disabled: alpha(neutral[900], 0.38)
    },
    warning
  };
}
