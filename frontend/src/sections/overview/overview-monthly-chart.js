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
  SvgIcon
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Chart } from 'src/components/chart';
import { useRouter } from 'next/router';
import { formatCurrency } from 'src/utils/format-currency';
import { categoryColors } from 'src/utils/categories';

const MONTHS = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];

const useChartOptions = (series) => {
  const theme = useTheme();
  const names = (series || []).map((item) => item.name);

  return {
    chart: {
      stacked: true,
      toolbar: {
        show: false
      }
    },
    colors: categoryColors(names),
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
      show: true
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '58%'
      }
    },
    stroke: {
      colors: ['transparent'],
      show: true,
      width: 2
    },
    theme: {
      mode: theme.palette.mode
    },
    tooltip: {
      custom: ({ series: tipSeries, dataPointIndex, w }) => {
        const seriesNames = w.globals.seriesNames;
        const colors = w.globals.colors;
        let total = 0;
        let rows = '';

        seriesNames.forEach((name, index) => {
          const value = tipSeries[index]?.[dataPointIndex] || 0;
          if (value <= 0) {
            return;
          }
          total += value;
          rows += `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;padding:2px 0;">`
            + `<span style="display:flex;align-items:center;">`
            + `<span style="width:9px;height:9px;border-radius:3px;background:${colors[index]};display:inline-block;margin-right:7px;"></span>${name}`
            + `</span>`
            + `<span style="font-weight:600;">${formatCurrency(value)}</span>`
            + `</div>`;
        });

        const month = w.globals.labels[dataPointIndex];
        const body = rows || '<div style="color:#9DA4AE;padding:2px 0;">Brak wydatków</div>';

        return `<div style="padding:10px 12px;font-size:12px;min-width:190px;">`
          + `<div style="font-weight:700;margin-bottom:5px;">${month}</div>`
          + body
          + `<div style="display:flex;justify-content:space-between;gap:20px;border-top:1px solid rgba(0,0,0,0.08);margin-top:6px;padding-top:6px;">`
          + `<span style="font-weight:600;">Razem</span>`
          + `<span style="font-weight:700;">${formatCurrency(total)}</span>`
          + `</div>`
          + `</div>`;
      }
    },
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
};

export const OverviewMonthlyChart = (props) => {
  const { chartSeries, sx, sync, title, overview } = props;
  const chartOptions = useChartOptions(chartSeries);

  const router = useRouter();

  return (
    <Card sx={sx}>
      <CardHeader
        action={!sync ? null : (
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
        title={title}
      />
      <CardContent>
        <Chart
          height={350}
          options={chartOptions}
          series={chartSeries}
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
  chartSeries: PropTypes.array,
  sx: PropTypes.object,
  sync: PropTypes.func,
  title: PropTypes.string,
  overview: PropTypes.string
};
