import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Chart } from 'src/components/chart';
import { categoryColors, getCategoryMeta } from 'src/utils/categories';

const RANGES = [
  { value: 'all', label: 'Ogółem' },
  { value: 'year', label: 'Rok' },
  { value: 'quarter', label: 'Kwartał' },
  { value: 'month', label: 'Miesiąc' },
];

const cutoffFor = (range) => {
  if (range === 'all') return null;
  const date = new Date();
  if (range === 'year') date.setFullYear(date.getFullYear() - 1);
  else if (range === 'quarter') date.setMonth(date.getMonth() - 3);
  else if (range === 'month') date.setMonth(date.getMonth() - 1);
  return date;
};

const useChartOptions = (labels) => {
  const theme = useTheme();
  return {
    chart: { background: 'transparent' },
    colors: categoryColors(labels),
    dataLabels: { enabled: false },
    labels,
    legend: { show: false },
    plotOptions: { pie: { donut: { size: '72%' }, expandOnClick: false } },
    states: { active: { filter: { type: 'none' } }, hover: { filter: { type: 'lighten', value: 0.06 } } },
    stroke: { width: 0 },
    theme: { mode: theme.palette.mode },
    tooltip: { fillSeriesColor: false, y: { formatter: (value) => `${Number(value).toFixed(1)}%` } }
  };
};

export const OverviewCategoriesChart = (props) => {
  const { invoices, sx } = props;
  const [range, setRange] = useState('all');

  const { labels, series } = useMemo(() => {
    const cutoff = cutoffFor(range);
    const totals = {};
    (invoices || []).forEach((invoice) => {
      if (cutoff && new Date(invoice.date) < cutoff) return;
      const name = invoice.category?.name ?? 'Inne';
      totals[name] = (totals[name] || 0) + parseFloat(invoice.amount || 0);
    });
    const sum = Object.values(totals).reduce((a, b) => a + b, 0);
    const entries = Object.entries(totals).filter(([, value]) => value > 0);
    return {
      labels: entries.map(([name]) => name),
      series: entries.map(([, value]) => (sum ? +((value / sum) * 100).toFixed(2) : 0)),
    };
  }, [invoices, range]);

  const chartOptions = useChartOptions(labels);
  const hasData = series.length > 0;

  return (
    <Card sx={sx}>
      <CardHeader
        title="Udział wg kategorii"
        action={(
          <ToggleButtonGroup
            exclusive
            size="small"
            value={range}
            onChange={(event, next) => { if (next) setRange(next); }}
          >
            {RANGES.map((item) => (
              <ToggleButton key={item.value} value={item.value} sx={{ px: 1.25, py: 0.25, textTransform: 'none' }}>
                {item.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
      />
      <CardContent>
        {hasData ? (
          <>
            <Chart height={300} options={chartOptions} series={series} type="donut" width="100%" />
            <Stack direction="row" flexWrap="wrap" justifyContent="center" sx={{ mt: 2, gap: 2.5 }}>
              {series.map((value, index) => {
                const label = labels[index];
                const { color, Icon } = getCategoryMeta(label);
                return (
                  <Box key={label} sx={{ alignItems: 'center', display: 'flex', flexDirection: 'column', minWidth: 64 }}>
                    <Box sx={{
                      alignItems: 'center', backgroundColor: alpha(color, 0.12), borderRadius: '50%',
                      color, display: 'flex', height: 40, justifyContent: 'center', width: 40
                    }}>
                      <Icon fontSize="small" />
                    </Box>
                    <Typography sx={{ mt: 1 }} variant="subtitle2">{label}</Typography>
                    <Typography color="text.secondary" variant="caption">{Number(value).toFixed(1)}%</Typography>
                  </Box>
                );
              })}
            </Stack>
          </>
        ) : (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">Brak danych w wybranym okresie</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

OverviewCategoriesChart.propTypes = {
  invoices: PropTypes.array,
  sx: PropTypes.object
};
