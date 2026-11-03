import { useState } from 'react';
import PropTypes from 'prop-types';
import ArrowPathIcon from '@heroicons/react/24/solid/ArrowPathIcon';
import ArrowRightIcon from '@heroicons/react/24/solid/ArrowRightIcon';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  SvgIcon,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Chart } from 'src/components/chart';
import { useRouter } from 'next/router';
import { formatCurrency } from 'src/utils/format-currency';
import { categoryColors, getCategoryMeta } from 'src/utils/categories';

const MONTHS = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];

const rowHtml = (color, label, value) =>
  '<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;padding:2px 0;">'
  + `<span style="display:flex;align-items:center;"><span style="width:9px;height:9px;border-radius:3px;background:${color};display:inline-block;margin-right:7px;"></span>${label}</span>`
  + `<span style="font-weight:600;">${formatCurrency(value)}</span></div>`;

const boxHtml = (title, rows, total) =>
  '<div style="padding:10px 12px;font-size:12px;min-width:190px;">'
  + `<div style="font-weight:700;margin-bottom:5px;">${title}</div>`
  + (rows || '<div style="color:#9DA4AE;padding:2px 0;">Brak wydatków</div>')
  + '<div style="display:flex;justify-content:space-between;gap:20px;border-top:1px solid rgba(0,0,0,0.08);margin-top:6px;padding-top:6px;">'
  + `<span style="font-weight:600;">Razem</span><span style="font-weight:700;">${formatCurrency(total)}</span></div></div>`;

const buildCategorySeries = (byCategory) => Object.entries(byCategory || {})
  .map(([name, data]) => ({ name, data }))
  .filter((item) => Array.isArray(item.data) && item.data.some((value) => value > 0));

export const OverviewMonthlyChart = (props) => {
  const { yearSeries = [], byCategoryByYear = {}, sx, sync, title, overview } = props;
  const theme = useTheme();
  const router = useRouter();
  const [mode, setMode] = useState('years'); // 'years' | 'categories'

  const currentYear = String(new Date().getFullYear());
  const categorySeries = buildCategorySeries(byCategoryByYear[currentYear]);
  const isCategories = mode === 'categories';
  const series = isCategories ? categorySeries : yearSeries;

  const yearShades = [
    alpha(theme.palette.primary.main, 0.22),
    alpha(theme.palette.primary.main, 0.5),
    theme.palette.primary.main
  ];
  const colors = isCategories
    ? categoryColors(series.map((item) => item.name))
    : yearShades.slice(Math.max(0, yearShades.length - series.length));

  // Years view: one colour per year, hovering a bar reveals that year's
  // category split. Categories view: stacked category colours with the split
  // visible, and the tooltip restates each component plus the monthly total.
  const tooltip = isCategories
    ? {
      shared: true,
      intersect: false,
      custom: ({ series: tipSeries, dataPointIndex, w }) => {
        let total = 0;
        let rows = '';
        w.globals.seriesNames.forEach((name, index) => {
          const value = tipSeries[index]?.[dataPointIndex] || 0;
          if (value <= 0) {
            return;
          }
          total += value;
          rows += rowHtml(w.globals.colors[index], name, value);
        });
        return boxHtml(w.globals.labels[dataPointIndex], rows, total);
      }
    }
    : {
      shared: false,
      intersect: true,
      custom: ({ seriesIndex, dataPointIndex, w }) => {
        const yearName = String(w.globals.seriesNames[seriesIndex]);
        const byCat = byCategoryByYear[yearName] || {};
        let total = 0;
        let rows = '';
        Object.entries(byCat).forEach(([category, data]) => {
          const value = (data && data[dataPointIndex]) || 0;
          if (value <= 0) {
            return;
          }
          total += value;
          rows += rowHtml(getCategoryMeta(category).color, category, value);
        });
        return boxHtml(`${w.globals.labels[dataPointIndex]} ${yearName}`, rows, total);
      }
    };

  const chartOptions = {
    chart: {
      stacked: isCategories,
      toolbar: {
        show: false
      }
    },
    colors,
    dataLabels: {
      enabled: false
    },
    fill: {
      opacity: 1,
      type: 'solid'
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    legend: {
      fontFamily: theme.typography.fontFamily,
      fontSize: '13px',
      horizontalAlign: 'center',
      itemMargin: {
        horizontal: 8,
        vertical: 4
      },
      labels: {
        colors: theme.palette.text.secondary
      },
      markers: {
        height: 10,
        radius: 3,
        width: 10
      },
      position: 'bottom',
      show: isCategories
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: isCategories ? '58%' : '70%'
      }
    },
    stroke: {
      colors: ['transparent'],
      show: true,
      width: isCategories ? 2 : 0
    },
    theme: {
      mode: theme.palette.mode
    },
    tooltip,
    xaxis: {
      axisBorder: {
        color: theme.palette.divider,
        show: true
      },
      axisTicks: {
        color: theme.palette.divider,
        show: true
      },
      categories: MONTHS,
      labels: {
        offsetY: 5,
        style: {
          colors: theme.palette.text.secondary
        }
      }
    },
    yaxis: {
      labels: {
        formatter: (value) => `${Math.round(value)} zł`,
        offsetX: -10,
        style: {
          colors: theme.palette.text.secondary
        }
      }
    }
  };

  return (
    <Card sx={sx}>
      <CardHeader
        action={(
          <Stack alignItems="center" direction="row" spacing={1}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={mode}
              onChange={(event, value) => value && setMode(value)}
            >
              <ToggleButton value="years" sx={{ px: 1.5, py: 0.25, textTransform: 'none' }}>
                Lata
              </ToggleButton>
              <ToggleButton value="categories" sx={{ px: 1.5, py: 0.25, textTransform: 'none' }}>
                Kategorie
              </ToggleButton>
            </ToggleButtonGroup>
            {sync && (
              <Button
                onClick={sync}
                color="inherit"
                size="small"
                startIcon={(
                  <SvgIcon fontSize="small">
                    <ArrowPathIcon />
                  </SvgIcon>
                )}
              >
                Sync
              </Button>
            )}
          </Stack>
        )}
        title={title}
      />
      <CardContent>
        <Chart
          key={mode}
          height={350}
          options={chartOptions}
          series={series}
          type="bar"
          width="100%"
        />
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        {!overview ? null : (
          <Button
            color="inherit"
            onClick={() => router.push(overview)}
            endIcon={(
              <SvgIcon fontSize="small">
                <ArrowRightIcon />
              </SvgIcon>
            )}
            size="small"
          >
            Szczegóły
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

OverviewMonthlyChart.propTypes = {
  yearSeries: PropTypes.array,
  byCategoryByYear: PropTypes.object,
  sx: PropTypes.object,
  sync: PropTypes.func,
  title: PropTypes.string,
  overview: PropTypes.string
};
