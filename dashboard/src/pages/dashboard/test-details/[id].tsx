import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import { useQuery } from 'react-query';
import axios from 'axios';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Layout from '@/components/Layout';

// Types
interface TestDetail {
  id: string;
  workflow_type: string;
  status: string;
  result: string;
  created_at: string;
  target_url: string;
  screenshots: string[];
  logs: string[];
  config: {
    workflow_type: string;
    target_url: string;
    username?: string;
    password?: string;
    search_query?: string;
    product_url?: string;
  };
  execution_time: number;
}

export default function TestDetails() {
  const router = useRouter();
  const { id } = router.query;

  // Check for authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Fetch test details (use task status endpoint)
  const { data: taskData, isLoading } = useQuery<any>(
    ['testDetail', id],
    async () => {
      if (!id) return null;
      const response = await axios.get(`/api/workflows/task/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data;
    },
    {
      enabled: !!id,
      retry: 3,
    }
  );

  // Map filesystem paths to static URLs for screenshots
  const screenshots: string[] = (taskData?.screenshots || []).map((p: string) =>
    p && p.startsWith('/data/screenshots')
      ? p.replace('/data/screenshots', '/api/static/screenshots')
      : p
  );

  // Build a display model combining taskData and defaults
  const testData: TestDetail = {
    id: (id as string) || taskData?.id || '',
    workflow_type: taskData?.result?.action || 'login',
    status: taskData?.status || 'pending',
    result: typeof taskData?.result === 'string' ? taskData.result : JSON.stringify(taskData?.result ?? ''),
    created_at: new Date().toISOString(),
    target_url: taskData?.result?.target_url || '',
    screenshots,
    logs: taskData?.logs || [],
    config: {
      workflow_type: taskData?.result?.action || 'login',
      target_url: taskData?.result?.target_url || '',
      username: taskData?.result?.email,
      search_query: taskData?.result?.query,
      product_url: taskData?.result?.product_url,
    },
    execution_time: 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <Layout title="Test Details">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title={`Test Details - ${testData.id}`}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mr: 2 }}
          aria-label="Go back"
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          Test Details
        </Typography>
      </Box>

      <Alert 
        severity={testData.status === 'success' ? 'success' : testData.status === 'failed' ? 'error' : 'warning'}
        sx={{ mb: 3 }}
      >
        Test {testData.status === 'success' ? 'completed successfully' : testData.status === 'failed' ? 'failed' : 'is in progress'}
      </Alert>

      <Grid container spacing={3}>
        {/* Test Summary */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Test ID
                  </Typography>
                  <Typography variant="body1">{testData.id}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Workflow Type
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {testData.workflow_type.replace('_', ' ')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={testData.status}
                    color={getStatusColor(testData.status) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body1">{formatDate(testData.created_at)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Execution Time
                  </Typography>
                  <Typography variant="body1">{testData.execution_time} seconds</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Target URL
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                    {testData.target_url}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Result
                  </Typography>
                  <Typography variant="body1">{testData.result}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Configuration */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Configuration
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Workflow Type
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {testData.config.workflow_type.replace('_', ' ')}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Target URL
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                    {testData.config.target_url}
                  </Typography>
                </Grid>

                {testData.config.username && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Username
                    </Typography>
                    <Typography variant="body1">{testData.config.username}</Typography>
                  </Grid>
                )}

                {testData.config.password && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Password
                    </Typography>
                    <Typography variant="body1">********</Typography>
                  </Grid>
                )}

                {testData.config.search_query && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Search Query
                    </Typography>
                    <Typography variant="body1">{testData.config.search_query}</Typography>
                  </Grid>
                )}

                {testData.config.product_url && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Product URL
                    </Typography>
                    <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                      {testData.config.product_url}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Screenshots */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Screenshots</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {testData.screenshots && testData.screenshots.length > 0 ? (
                  testData.screenshots.map((screenshot: string, index: number) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Card>
                        <CardContent>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Step {index + 1}
                          </Typography>
                          <Box 
                            component="img" 
                            src={screenshot}
                            alt={`Test step ${index + 1}`}
                            sx={{ 
                              width: '100%', 
                              border: '1px solid #eee',
                              borderRadius: 1,
                            }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Typography>No screenshots available</Typography>
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Logs */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Logs</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper 
                sx={{ 
                  p: 2, 
                  bgcolor: '#f5f5f5', 
                  maxHeight: 400, 
                  overflow: 'auto',
                  fontFamily: 'monospace',
                }}
              >
                {testData.logs && testData.logs.length > 0 ? (
                  testData.logs.map((log: string, index: number) => (
                    <Typography key={index} variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 0.5 }}>
                      {log}
                    </Typography>
                  ))
                ) : (
                  <Typography>No logs available</Typography>
                )}
              </Paper>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="outlined" 
              onClick={() => router.push('/dashboard/history')}
              sx={{ mr: 2 }}
              aria-label="View all tests"
            >
              View All Tests
            </Button>
            <Button 
              variant="contained" 
              onClick={() => router.push('/dashboard/test-runner')}
              aria-label="Run new test"
            >
              Run New Test
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Layout>
  );
}