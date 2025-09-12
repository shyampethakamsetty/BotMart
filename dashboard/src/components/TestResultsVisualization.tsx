import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Chip, Divider, Paper } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface TestStep {
  id: string;
  name: string;
  status: 'success' | 'error' | 'pending';
  duration: number;
  screenshot?: string;
  error?: string;
  timestamp: string;
}

interface TestResult {
  id: string;
  workflowName: string;
  status: 'success' | 'error' | 'pending';
  startTime: string;
  endTime?: string;
  duration: number;
  steps: TestStep[];
  url?: string;
  browser?: string;
  device?: string;
}

interface TestResultsVisualizationProps {
  result: TestResult;
  showDetails?: boolean;
}

const TestResultsVisualization: React.FC<TestResultsVisualizationProps> = ({ 
  result, 
  showDetails = true 
}) => {
  // Calculate success rate
  const totalSteps = result.steps.length;
  const successfulSteps = result.steps.filter(step => step.status === 'success').length;
  const successRate = totalSteps > 0 ? (successfulSteps / totalSteps) * 100 : 0;

  // Format duration in seconds
  const formatDuration = (ms: number) => {
    const seconds = ms / 1000;
    return seconds.toFixed(2) + 's';
  };

  // Status indicator component
  const StatusIndicator = ({ status }: { status: 'success' | 'error' | 'pending' }) => {
    return (
      <Box display="flex" alignItems="center">
        {status === 'success' && <CheckCircleIcon color="success" />}
        {status === 'error' && <ErrorIcon color="error" />}
        {status === 'pending' && <AccessTimeIcon color="action" />}
        <Typography variant="body2" sx={{ ml: 1 }}>
          {status === 'success' && 'Passed'}
          {status === 'error' && 'Failed'}
          {status === 'pending' && 'Running'}
        </Typography>
      </Box>
    );
  };

  return (
    <Card variant="outlined" sx={{ mb: 3, overflow: 'hidden' }}>
      <CardContent>
        <Grid container spacing={2}>
          {/* Header with test name and status */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" component="h2">
                {result.workflowName}
              </Typography>
              <StatusIndicator status={result.status} />
            </Box>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          {/* Test metadata */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">Start Time</Typography>
            <Typography variant="body1">{new Date(result.startTime).toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">Duration</Typography>
            <Typography variant="body1">{formatDuration(result.duration)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">Success Rate</Typography>
            <Typography variant="body1">{successRate.toFixed(0)}%</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">Steps</Typography>
            <Typography variant="body1">{successfulSteps} / {totalSteps}</Typography>
          </Grid>

          {/* Environment info */}
          {(result.browser || result.device || result.url) && (
            <Grid item xs={12}>
              <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                {result.browser && <Chip label={`Browser: ${result.browser}`} size="small" />}
                {result.device && <Chip label={`Device: ${result.device}`} size="small" />}
                {result.url && <Chip label={`URL: ${result.url}`} size="small" />}
              </Box>
            </Grid>
          )}

          {/* Detailed steps visualization */}
          {showDetails && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Test Steps</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {result.steps.map((step, index) => (
                  <Paper key={step.id} variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2">
                            {index + 1}. {step.name}
                          </Typography>
                          <StatusIndicator status={step.status} />
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Duration</Typography>
                        <Typography variant="body2">{formatDuration(step.duration)}</Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Timestamp</Typography>
                        <Typography variant="body2">{new Date(step.timestamp).toLocaleTimeString()}</Typography>
                      </Grid>
                      
                      {/* Error message if any */}
                      {step.error && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                            Error: {step.error}
                          </Typography>
                        </Grid>
                      )}
                      
                      {/* Screenshot if available */}
                      {step.screenshot && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>Screenshot</Typography>
                          <Box 
                            component="img" 
                            src={step.screenshot}
                            alt={`Screenshot of ${step.name}`}
                            sx={{
                              maxWidth: '100%',
                              maxHeight: '300px',
                              objectFit: 'contain',
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1
                            }}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                ))}
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default TestResultsVisualization;