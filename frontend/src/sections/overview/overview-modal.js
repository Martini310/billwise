import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import PropTypes from 'prop-types';


const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 5
};

// export const BasicModal = () => {

//   const [open, setOpen] = React.useState(op);
//   const handleOpen = () => setOpen(true);
//   const handleClose = () => setOpen(false);

//   return (
//     <Modal
//     open={true}
//     // onClose={handleClose}
//     aria-labelledby="modal-modal-title"
//     aria-describedby="modal-modal-description"
//     >
//     <Box sx={style}>
//         <Typography id="modal-modal-title" variant="h6" component="h2">
//         Text in a modal
//         </Typography>
//         <Typography id="modal-modal-description" sx={{ mt: 2 }}>
//         Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
//         </Typography>
//     </Box>
//     </Modal>
//   );
// }

export const BasicModal = (props) => {
    const { open, onClose, order } = props;
  
    return (
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Text in a modal
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            {order ? order.number : ''}
          </Typography>
        </Box>
      </Modal>
    );
  };
  
