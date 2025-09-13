import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';

export interface WorkflowConfig {
  workflowType: string;
  url: string;
  browser: string;
  device?: string;
  username?: string;
  password?: string;
  // New advanced search filters
  category?: string;
  priceMin?: number;
  priceMax?: number;
  brand?: string;
  sortBy?: string;
  // Legacy fields for other workflow types
  searchQuery?: string;
  productId?: string;
  quantity?: number;
  checkoutMethod?: string;
}

interface WorkflowConfigFormProps {
  onSubmit: (config: WorkflowConfig) => void;
  isSubmitting: boolean;
}

const WorkflowConfigForm: React.FC<WorkflowConfigFormProps> = ({ onSubmit, isSubmitting }) => {
  const [config, setConfig] = useState<WorkflowConfig>({
    workflowType: 'login',
    url: 'https://demo.nopcommerce.com',
    browser: 'chrome',
    device: 'desktop',
    username: '',
    password: '',
    // New search filters
    category: '',
    priceMin: undefined,
    priceMax: undefined,
    brand: '',
    sortBy: 'default',
    // Legacy fields
    searchQuery: '',
    productId: '',
    quantity: 1,
    checkoutMethod: 'credit_card',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? undefined : parseFloat(value);
    setConfig(prev => ({ ...prev, [name]: numValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>Workflow Configuration</Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Workflow Type */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <Typography variant="subtitle2" gutterBottom>Workflow Type</Typography>
                <RadioGroup
                  row
                  name="workflowType"
                  value={config.workflowType}
                  onChange={handleChange}
                >
                  <FormControlLabel value="login" control={<Radio />} label="Login" />
                  <FormControlLabel value="search" control={<Radio />} label="Search" />
                  <FormControlLabel value="add_to_cart" control={<Radio />} label="Add to Cart" />
                  <FormControlLabel value="checkout" control={<Radio />} label="Checkout" />
                  <FormControlLabel value="full_purchase" control={<Radio />} label="Full Purchase Flow" />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* URL */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Target URL"
                name="url"
                value={config.url}
                onChange={handleChange}
                helperText="The e-commerce website URL"
                required
              />
            </Grid>

            {/* Browser */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="browser-label">Browser</InputLabel>
                <Select
                  labelId="browser-label"
                  name="browser"
                  value={config.browser}
                  label="Browser"
                  onChange={handleSelectChange}
                  required
                >
                  <MenuItem value="chrome">Chrome</MenuItem>
                  <MenuItem value="firefox">Firefox</MenuItem>
                  <MenuItem value="safari">Safari</MenuItem>
                  <MenuItem value="edge">Edge</MenuItem>
                </Select>
                <FormHelperText>Select the browser to run the test</FormHelperText>
              </FormControl>
            </Grid>

            {/* Device */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="device-label">Device</InputLabel>
                <Select
                  labelId="device-label"
                  name="device"
                  value={config.device}
                  label="Device"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="desktop">Desktop</MenuItem>
                  <MenuItem value="mobile">Mobile</MenuItem>
                  <MenuItem value="tablet">Tablet</MenuItem>
                </Select>
                <FormHelperText>Select the device type to emulate</FormHelperText>
              </FormControl>
            </Grid>

            {/* Conditional fields based on workflow type */}
            {(config.workflowType === 'login' || config.workflowType === 'full_purchase') && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={config.username}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type="password"
                    value={config.password}
                    onChange={handleChange}
                    required
                  />
                </Grid>
              </>
            )}

            {(config.workflowType === 'search' || config.workflowType === 'full_purchase') && (
              <>
                {/* Category Filter */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                      labelId="category-label"
                      name="category"
                      value={config.category || ''}
                      label="Category"
                      onChange={handleSelectChange}
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      <MenuItem value="computers">Computers</MenuItem>
                      <MenuItem value="desktops">Desktops</MenuItem>
                      <MenuItem value="notebooks">Notebooks</MenuItem>
                      <MenuItem value="software">Software</MenuItem>
                      <MenuItem value="electronics">Electronics</MenuItem>
                      <MenuItem value="camera-photo">Camera & Photo</MenuItem>
                      <MenuItem value="cell-phones">Cell Phones</MenuItem>
                      <MenuItem value="apparel">Apparel</MenuItem>
                      <MenuItem value="shoes">Shoes</MenuItem>
                      <MenuItem value="clothing">Clothing</MenuItem>
                      <MenuItem value="accessories">Accessories</MenuItem>
                      <MenuItem value="digital-downloads">Digital Downloads</MenuItem>
                      <MenuItem value="books">Books</MenuItem>
                      <MenuItem value="jewelry">Jewelry</MenuItem>
                      <MenuItem value="gift-cards">Gift Cards</MenuItem>
                    </Select>
                    <FormHelperText>Select product category to filter</FormHelperText>
                  </FormControl>
                </Grid>

                {/* Price Range */}
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Min Price"
                    name="priceMin"
                    type="number"
                    value={config.priceMin || ''}
                    onChange={handlePriceChange}
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                    helperText="Minimum price filter"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Max Price"
                    name="priceMax"
                    type="number"
                    value={config.priceMax || ''}
                    onChange={handlePriceChange}
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                    helperText="Maximum price filter"
                  />
                </Grid>

                {/* Brand Filter */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                    label="Brand"
                    name="brand"
                    value={config.brand || ''}
                  onChange={handleChange}
                    helperText="Filter by brand/manufacturer name"
                />
              </Grid>

                {/* Sort By */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="sort-label">Sort By</InputLabel>
                    <Select
                      labelId="sort-label"
                      name="sortBy"
                      value={config.sortBy || 'default'}
                      label="Sort By"
                      onChange={handleSelectChange}
                    >
                      <MenuItem value="default">Default</MenuItem>
                      <MenuItem value="name_asc">Name: A to Z</MenuItem>
                      <MenuItem value="name_desc">Name: Z to A</MenuItem>
                      <MenuItem value="price_asc">Price: Low to High</MenuItem>
                      <MenuItem value="price_desc">Price: High to Low</MenuItem>
                      <MenuItem value="created">Created Date</MenuItem>
                    </Select>
                    <FormHelperText>Choose how to sort results</FormHelperText>
                  </FormControl>
                </Grid>
              </>
            )}

            {(config.workflowType === 'add_to_cart' || 
              config.workflowType === 'checkout' || 
              config.workflowType === 'full_purchase') && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Product ID"
                    name="productId"
                    value={config.productId}
                    onChange={handleChange}
                    helperText="ID of the product to add to cart"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    name="quantity"
                    type="number"
                    value={config.quantity}
                    onChange={handleNumberChange}
                    InputProps={{ inputProps: { min: 1 } }}
                    required
                  />
                </Grid>
              </>
            )}

            {(config.workflowType === 'checkout' || config.workflowType === 'full_purchase') && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="checkout-method-label">Checkout Method</InputLabel>
                  <Select
                    labelId="checkout-method-label"
                    name="checkoutMethod"
                    value={config.checkoutMethod}
                    label="Checkout Method"
                    onChange={handleSelectChange}
                    required
                  >
                    <MenuItem value="credit_card">Credit Card</MenuItem>
                    <MenuItem value="paypal">PayPal</MenuItem>
                    <MenuItem value="apple_pay">Apple Pay</MenuItem>
                    <MenuItem value="google_pay">Google Pay</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Submit Button */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                sx={{ mt: 2 }}
              >
                {isSubmitting ? 'Running Test...' : 'Run Test'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WorkflowConfigForm;