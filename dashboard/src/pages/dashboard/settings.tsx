import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material';
import { useMutation } from 'react-query';
import axios from 'axios';
import Layout from '@/components/Layout';

// Types
interface UserSettings {
  notifications_enabled: boolean;
  auto_refresh_interval: number;
  default_workflow_type: string;
  high_contrast_mode: boolean;
  large_text_mode: boolean;
}

export default function Settings() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>({
    notifications_enabled: true,
    auto_refresh_interval: 30,
    default_workflow_type: 'login',
    high_contrast_mode: false,
    large_text_mode: false,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // Check for authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      // Load settings from localStorage for demo purposes
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch (e) {
          console.error('Failed to parse saved settings', e);
        }
      }
    }
  }, [router]);

  // Save settings mutation
  const { mutate: saveSettings, isLoading } = useMutation(
    async (updatedSettings: UserSettings) => {
      // In a real app, this would be an API call
      // const response = await axios.post('/api/user/settings', updatedSettings, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      // });
      // return response.data;
      
      // For demo purposes, save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      return updatedSettings;
    },
    {
      onSuccess: () => {
        setSnackbar({
          open: true,
          message: 'Settings saved successfully',
          severity: 'success',
        });
      },
      onError: () => {
        setSnackbar({
          open: true,
          message: 'Failed to save settings',
          severity: 'error',
        });
      },
    }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = () => {
    saveSettings(settings);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Layout title="Settings">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Configure your dashboard preferences
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              General Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications_enabled}
                    onChange={handleSwitchChange}
                    name="notifications_enabled"
                    color="primary"
                  />
                }
                label="Enable Notifications"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                Receive notifications when tests complete or fail
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="refresh-interval-label">Auto-refresh Interval</InputLabel>
                <Select
                  labelId="refresh-interval-label"
                  name="auto_refresh_interval"
                  value={settings.auto_refresh_interval}
                  label="Auto-refresh Interval"
                  onChange={handleSelectChange}
                >
                  <MenuItem value={0}>Disabled</MenuItem>
                  <MenuItem value={15}>15 seconds</MenuItem>
                  <MenuItem value={30}>30 seconds</MenuItem>
                  <MenuItem value={60}>1 minute</MenuItem>
                  <MenuItem value={300}>5 minutes</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="default-workflow-label">Default Workflow Type</InputLabel>
                <Select
                  labelId="default-workflow-label"
                  name="default_workflow_type"
                  value={settings.default_workflow_type}
                  label="Default Workflow Type"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="login">Login</MenuItem>
                  <MenuItem value="search">Search</MenuItem>
                  <MenuItem value="add_to_cart">Add to Cart</MenuItem>
                </Select>
              </FormControl>
            </FormGroup>
          </Paper>
        </Grid>

        {/* Accessibility Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Accessibility Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.high_contrast_mode}
                    onChange={handleSwitchChange}
                    name="high_contrast_mode"
                    color="primary"
                  />
                }
                label="High Contrast Mode"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                Increase contrast for better visibility
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.large_text_mode}
                    onChange={handleSwitchChange}
                    name="large_text_mode"
                    color="primary"
                  />
                }
                label="Large Text Mode"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                Increase text size for better readability
              </Typography>
            </FormGroup>
          </Paper>

          {/* API Keys (Placeholder) */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              API Keys
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Alert severity="info" sx={{ mb: 2 }}>
              API keys are used for integrating with external services.
            </Alert>

            <TextField
              fullWidth
              label="API Key"
              value="••••••••••••••••••••••••••••••"
              disabled
              sx={{ mb: 2 }}
            />

            <Button variant="outlined" size="small">
              Generate New Key
            </Button>
          </Paper>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSaveSettings}
              disabled={isLoading}
              aria-label="Save settings"
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
}