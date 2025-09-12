import React from 'react';
import { Box, Card, CardContent, Grid, Typography, LinearProgress, Tooltip } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  progress?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  subtitle,
  progress 
}) => {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ my: 1, fontWeight: 'medium' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box 
            sx={{ 
              p: 1, 
              borderRadius: '50%', 
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
        {progress !== undefined && (
          <Tooltip title={`${progress}%`} arrow placement="top">
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                mt: 2, 
                height: 6, 
                borderRadius: 3,
                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  bgcolor: `${color}.main`,
                }
              }} 
            />
          </Tooltip>
        )}
      </CardContent>
    </Card>
  );
};

interface MetricsDisplayProps {
  successRate: number;
  totalTests: number;
  failedTests: number;
  avgDuration: number;
  pendingTests?: number;
}

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ 
  successRate, 
  totalTests, 
  failedTests, 
  avgDuration,
  pendingTests = 0
}) => {
  // Format duration in seconds to readable format
  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Success Rate"
          value={`${successRate}%`}
          icon={<CheckCircleOutlineIcon />}
          color="success"
          progress={successRate}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Total Tests"
          value={totalTests}
          icon={<SpeedIcon />}
          color="primary"
          subtitle={`${totalTests - failedTests - pendingTests} passed`}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Failed Tests"
          value={failedTests}
          icon={<ErrorOutlineIcon />}
          color="error"
          subtitle={failedTests > 0 ? 'Needs attention' : 'All tests passing'}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Avg. Duration"
          value={formatDuration(avgDuration)}
          icon={<AccessTimeIcon />}
          color="info"
          subtitle="Per test workflow"
        />
      </Grid>
    </Grid>
  );
};

export default MetricsDisplay;