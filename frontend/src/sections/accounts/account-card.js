import PropTypes from 'prop-types';
import UserCircleIcon from '@heroicons/react/24/solid/UserCircleIcon';
import { alpha } from '@mui/material/styles';
import { Avatar, Box, Card, CardContent, Chip, Divider, Stack, SvgIcon, Typography } from '@mui/material';
import { CardActionArea } from '@mui/material';
import Link from 'next/link';
import { formatDatetime } from 'src/utils/format-datetime';
import { getCategoryMeta } from 'src/utils/categories';
import { OrangeSetupDialog } from './orange-setup-dialog';


export const AccountCard = (props) => {
  const { account, onConfigured } = props;
  const needsOrangeSetup = account.supplier?.name === 'Orange' && !account.device_token;
  const img='/assets/logos/logo-' + (account.supplier['name']).toLowerCase() + '.png'
  const { color: categoryColor, Icon: CategoryIcon } = getCategoryMeta(account.category?.['name']);

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <Link href={{ pathname: 'edit-account/', query: { accountId: account.id } }} style={{ textDecoration: 'none', color: 'black' }}>
      <CardActionArea>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            pb: 0
          }}
        >
          <Box
            component="img"
            alt={account.supplier['name']}
            src={img}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/logos/logo-inne.png'; }}
            sx={{ width: 200, height: 100, objectFit: 'contain' }}
          />
        </Box>
        {account.notification && 
          <Typography
            align="center"
            gutterBottom
            variant="h6"
            color="red"
            >
              {account.notification}
        </Typography>}
        <Typography
          align="center"
          gutterBottom
          variant="h5"
          >
          {account.supplier['name']}
        </Typography>
        {account.group && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
            <Chip
              size="small"
              label={account.group.name}
              sx={{
                backgroundColor: alpha(account.group.color, 0.12),
                color: account.group.color,
                fontWeight: 600,
              }}
            />
          </Box>
        )}
        <Typography
          align="center"
          variant="body1"
        >
          {account.supplier['url']}  
        </Typography>
        <Typography
          color="text.secondary"
          variant="body2"
          align="center"
        >
          zaktualizowano {formatDatetime(new Date(account.last_sync))}
        </Typography>
      </CardContent></CardActionArea></Link>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      {needsOrangeSetup && (
        <Box sx={{ px: 2, pt: 2 }}>
          <OrangeSetupDialog account={account} onConfigured={onConfigured} />
        </Box>
      )}
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        spacing={2}
        sx={{ p: 2 }}
      >
        <Stack
          alignItems="center"
          direction="row"
          spacing={1}
        >
          <SvgIcon
            color="action"
            fontSize="small"
          >
            <UserCircleIcon />
          </SvgIcon>
          <Typography
            color="text.secondary"
            display="inline"
            variant="body2"
          >
            {account.login}
          </Typography>
        </Stack>
        <Chip
          size="small"
          icon={<CategoryIcon style={{ color: categoryColor, fontSize: 16 }} />}
          label={account.category?.['name']}
          sx={{
            backgroundColor: alpha(categoryColor, 0.12),
            color: categoryColor,
            fontWeight: 600,
            '& .MuiChip-icon': { color: categoryColor },
          }}
        />
      </Stack>
    </Card>
  );
};

AccountCard.propTypes = {
  account: PropTypes.object.isRequired,
  onConfigured: PropTypes.func
};
