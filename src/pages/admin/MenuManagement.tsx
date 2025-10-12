import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Drawer,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Chip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Close,
  Upload
} from '@mui/icons-material';

// Mock data for menu items
const mockMenuItems = [
  { id: '1', name: 'Cheeseburger', category: 'Burgers', price: 8.99, image: 'https://via.placeholder.com/50', available: true },
  { id: '2', name: 'French Fries', category: 'Sides', price: 3.99, image: 'https://via.placeholder.com/50', available: true },
  { id: '3', name: 'Coca Cola', category: 'Drinks', price: 1.99, image: 'https://via.placeholder.com/50', available: true },
  { id: '4', name: 'Chicken Nuggets', category: 'Sides', price: 5.99, image: 'https://via.placeholder.com/50', available: false },
  { id: '5', name: 'Veggie Burger', category: 'Burgers', price: 7.99, image: 'https://via.placeholder.com/50', available: true },
];

// Categories for dropdown
const categories = ['Burgers', 'Sides', 'Drinks', 'Desserts', 'Combos'];

const MenuManagement: React.FC = () => {
  const [menuItems, setMenuItems] = useState(mockMenuItems);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleOpenDrawer = (item?: any) => {
    if (item) {
      setCurrentItem(item);
      setIsEditing(true);
    } else {
      setCurrentItem({
        name: '',
        category: '',
        price: '',
        image: '',
        available: true
      });
      setIsEditing(false);
    }
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setCurrentItem(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setCurrentItem({
      ...currentItem,
      [name as string]: value
    });
  };

  const handleAvailabilityChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { value } = e.target;
    setCurrentItem({
      ...currentItem,
      available: value === 'true'
    });
  };

  const handleSaveItem = () => {
    if (isEditing) {
      // Update existing item
      setMenuItems(menuItems.map(item => 
        item.id === currentItem.id ? currentItem : item
      ));
    } else {
      // Add new item
      const newItem = {
        ...currentItem,
        id: Date.now().toString()
      };
      setMenuItems([...menuItems, newItem]);
    }
    handleCloseDrawer();
  };

  const handleDeleteItem = (id: string) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Menu Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDrawer()}
        >
          Add New Item
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {menuItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Avatar src={item.image} alt={item.name} variant="rounded" />
                </TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>${item.price.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip 
                    label={item.available ? 'Available' : 'Unavailable'} 
                    color={item.available ? 'success' : 'error'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleOpenDrawer(item)}>
                    <Edit />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDeleteItem(item.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        sx={{
          '& .MuiDrawer-paper': { width: { xs: '100%', sm: 400 } },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}
            </Typography>
            <IconButton onClick={handleCloseDrawer}>
              <Close />
            </IconButton>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sx={{ textAlign: 'center', mb: 2 }}>
              {currentItem?.image ? (
                <Avatar 
                  src={currentItem.image} 
                  alt={currentItem.name} 
                  variant="rounded"
                  sx={{ width: 100, height: 100, mx: 'auto' }}
                />
              ) : (
                <Box 
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    bgcolor: 'grey.200', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderRadius: 1,
                    mx: 'auto'
                  }}
                >
                  <Upload />
                </Box>
              )}
              <Button 
                variant="outlined" 
                component="label" 
                size="small" 
                sx={{ mt: 1 }}
              >
                Upload Image
                <input
                  type="file"
                  hidden
                />
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Item Name"
                name="name"
                value={currentItem?.name || ''}
                onChange={handleInputChange}
                margin="normal"
                required
              />
            </Grid>
            
            {/* <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={currentItem?.category || ''}
                  onChange={handleInputChange}
                  label="Category"
                  required
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid> */}
            
            {/* <Grid item xs={12}>
              <TextField
                fullWidth
                label="Price"
                name="price"
                type="number"
                value={currentItem?.price || ''}
                onChange={handleInputChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: '$',
                }}
              />
            </Grid>
             */}
            {/* <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Availability</InputLabel>
                <Select
                  name="available"
                  value={currentItem?.available ? 'true' : 'false'}
                  onChange={handleAvailabilityChange}
                  label="Availability"
                >
                  <MenuItem value="true">Available</MenuItem>
                  <MenuItem value="false">Unavailable</MenuItem>
                </Select>
              </FormControl>
            </Grid> */}
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleSaveItem}
              >
                {isEditing ? 'Update Item' : 'Add Item'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Drawer>
    </Box>
  );
};

export default MenuManagement;