import * as React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import InboxIcon from '@mui/icons-material/Inbox';
import DraftsIcon from '@mui/icons-material/Drafts';
import { useState, useEffect } from 'react';


export default function BasicList() {
    const [suppliers, setSupplier] = useState([])

    const fetchSupplierData = () => {
    fetch("http://127.0.0.1:8000/api/suppliers/")
        .then(response => {
        return response.json()
        })
        .then(data => {
        setSupplier(data)
        })
    }

    useEffect(() => {
    fetchSupplierData()
    }, [])
  return (
    <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>

        return (
        <div>
            {suppliers.length > 0 && (
            <ul>
                {suppliers.map(supplier => (
                <li key={supplier.id}>{supplier.name}</li>
                ))}
            </ul>
            )}
        </div>
        );
      <Divider />
      <nav aria-label="secondary mailbox folders">
        
        <List>
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemText primary="Trash" />
            </ListItemButton>
          </ListItem>


          <ListItem disablePadding>
            <ListItemButton component="a" href="#simple-list">
              <ListItemText primary="Spam" />
            </ListItemButton>
          </ListItem>
        </List>
      </nav>
    </Box>
  );
}
