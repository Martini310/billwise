import * as React from 'react';
import 'dayjs/locale/pl';
import TextField from '@mui/material/TextField';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// export default function BasicDatePicker({label}) {
//   const [value, setValue] = React.useState(null);

//   return (
//     <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
//       <DatePicker
//         type='date'
//         label={label}
//         value={value}
//         onChange={(newValue) => {
//           setValue(newValue); console.log(newValue.toISOString());
//         }}
//         renderInput={(params) => <TextField {...params} />}
//       />
//     </LocalizationProvider>
//   );
// }
export default function BasicDatePicker({ label, name, onChange }) {
  const [value, setValue] = React.useState(null);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
      <DatePicker
        type='date'
        label={label}
        value={value}
        onChange={(newValue) => {
          setValue(newValue);
          if (onChange) {
            onChange({ target: { name, value: newValue } });
          }
        }}
        renderInput={(params) => <TextField {...params} />}
        dateFormat="dd/MM/YYYY"
/>
    </LocalizationProvider>
  );
}