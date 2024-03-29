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
import { alpha, useTheme } from '@mui/material/styles';
import { Chart } from 'src/components/chart';
import {useRouter} from 'next/router';



const useChartOptions = () => {
  const theme = useTheme();

  return {
    chart: {
      stacked: false,
      toolbar: {
        show: false
      }
    },
    colors: [alpha(theme.palette.primary.main, 0.15), alpha(theme.palette.primary.main, 0.4), theme.palette.primary.main],
    dataLabels: {
      enabled: false
    },
    fill: {
      opacity: 1,
      type: 'solid'
    },
    grid: {
      borderColor: theme.palette.grey[300],
      strokeDashArray: 5,
      wid: 5,
      xaxis: {
        lines: {
          show: true,
        }
      },
      yaxis: {
        lines: {
          show: true,
        }
      }
    },
    legend: {
      show: false
    },
    plotOptions: {
      bar: {
        columnWidth: '50px'
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
    xaxis: {
      axisBorder: {
        color: theme.palette.divider,
        show: true
      },
      axisTicks: {
        color: theme.palette.divider,
        show: true
      },
      categories: [
        'Sty',
        'Lut',
        'Mar',
        'Kwi',
        'Maj',
        'Cze',
        'Lip',
        'Sie',
        'Wrz',
        'Paź',
        'Lis',
        'Gru'
      ],
      labels: {
        offsetY: 5,
        style: {
          colors: theme.palette.text.secondary
        }
      }
    },
    yaxis: {
      labels: {
        formatter: (value) => (value > 0 ? `${+value.toFixed(2)}zł` : `${value}`),
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
  const chartOptions = useChartOptions();

  const router = useRouter()

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

OverviewMonthlyChart.protoTypes = {
  chartSeries: PropTypes.array.isRequired,
  sx: PropTypes.object
};
