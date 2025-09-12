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
    url: 'https://example.com',
    browser: 'chrome',
    device: 'desktop',
    username: '',
    password: '',
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Search Query"
                  name="searchQuery"
                  value={config.searchQuery}
                  onChange={handleChange}
                  helperText="Product or keyword to search for"
                  required
                />
              </Grid>
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