import PropTypes from 'prop-types';
import UserCircleIcon from '@heroicons/react/24/solid/UserCircleIcon';
import TagIcon from '@heroicons/react/24/solid/TagIcon';
import { Avatar, Box, Card, CardContent, Divider, Stack, SvgIcon, Typography } from '@mui/material';
import { CardActionArea } from '@mui/material';
import Link from 'next/link';


export const AccountCard = (props) => {
  const { account } = props;
  const img='/assets/logos/logo-' + (account.supplier['name']).toLowerCase() + '.png'

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
            pb: 3
          }}
        >
          <Avatar
            src={img}
            variant="square"
            sx={{ width: 160, height: 100 }}
          />
        </Box>
        <Typography
          align="center"
          gutterBottom
          variant="h5"
          >
          {account.supplier['name']}
        </Typography>
        <Typography
          align="center"
          variant="body1"
        >
          {account.supplier['url']}
        </Typography>
      </CardContent></CardActionArea></Link>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
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
        <Stack
          alignItems="center"
          direction="row"
          spacing={1}
        >
          <SvgIcon
            color="action"
            fontSize="small"
          >
            <TagIcon />
          </SvgIcon>
          <Typography
            color="text.secondary"
            display="inline"
            variant="body2"
          >
            {account.category['name']}
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
};

AccountCard.propTypes = {
  account: PropTypes.object.isRequired
};
