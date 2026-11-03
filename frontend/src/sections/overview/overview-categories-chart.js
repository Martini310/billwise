import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Chart } from 'src/components/chart';
import { categoryColors, getCategoryMeta } from 'src/utils/categories';

const useChartOptions = (labels) => {
  const theme = useTheme();

  return {
    chart: {
      background: 'transparent'
    },
    colors: categoryColors(labels),
    dataLabels: {
      enabled: false
    },
    labels,
    legend: {
      show: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%'
        },
        expandOnClick: false
      }
    },
    states: {
      active: {
        filter: {
          type: 'none'
        }
      },
      hover: {
        filter: {
          type: 'lighten',
          value: 0.06
        }
      }
    },
    stroke: {
      width: 0
    },
    theme: {
      mode: theme.palette.mode
    },
    tooltip: {
      fillSeriesColor: false,
      y: {
        formatter: (value) => `${Number(value).toFixed(1)}%`
      }
    }
  };
};

export const OverviewCategoriesChart = (props) => {
  const { chartSeries, labels, sx } = props;
  const chartOptions = useChartOptions(labels);
  const hasData = Array.isArray(chartSeries) && chartSeries.length > 0;

  return (
    <Card sx={sx}>
      <CardHeader title="Udział wg kategorii" />
      <CardContent>
        {hasData ? (
          <>
            <Chart
              height={300}
              options={chartOptions}
              series={chartSeries}
              type="donut"
              width="100%"
            />
            <Stack
              direction="row"
              flexWrap="wrap"
              justifyContent="center"
              sx={{ mt: 2, gap: 2.5 }}
            >
              {chartSeries.map((item, index) => {
                const label = labels[index];
                const { color, Icon } = getCategoryMeta(label);

                return (
                  <Box
                    key={label}
                    sx={{
                      alignItems: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      minWidth: 64
                    }}
                  >
                    <Box
                      sx={{
                        alignItems: 'center',
                        backgroundColor: alpha(color, 0.12),
                        borderRadius: '50%',
                        color,
                        display: 'flex',
                        height: 40,
                        justifyContent: 'center',
                        width: 40
                      }}
                    >
                      <Icon fontSize="small" />
                    </Box>
                    <Typography
                      sx={{ mt: 1 }}
                      variant="subtitle2"
                    >
                      {label}
                    </Typography>
                    <Typography
                      color="text.secondary"
                      variant="caption"
                    >
                      {Number(item).toFixed(1)}%
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </>
        ) : (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography
              color="text.secondary"
              variant="body2"
            >
              Brak danych do wyświetlenia
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

OverviewCategoriesChart.propTypes = {
  chartSeries: PropTypes.array.isRequired,
  labels: PropTypes.array.isRequired,
  sx: PropTypes.object
};
