import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Paper,
} from '@mui/material';
import { useQuery } from 'react-query';
import axios from 'axios';
import Layout from '@/components/Layout';

// Types for our data
interface WorkflowSummary {
  total: number;
  success: number;
  failed: number;
  pending: number;
}

interface RecentTest {
  id: string;
  workflow_type: string;
  status: string;
  created_at: string;
  result: string;
}

export default function Dashboard() {
  const router = useRouter();
  
  // Check for authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Fetch workflow summary data
  const { data: summaryData, isLoading: summaryLoading } = useQuery<WorkflowSummary>(
    'workflowSummary',
    async () => {
      const response = await axios.get('/api/workflows/summary', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data;
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      retry: 3,
    }
  );

  // Fetch recent tests
  const { data: recentTests, isLoading: testsLoading } = useQuery<RecentTest[]>(
    'recentTests',
    async () => {
      const response = await axios.get('/api/workflows/recent', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data;
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      retry: 3,
    }
  );

  // For demo purposes, create mock data if API fails
  const summary = summaryData || { total: 24, success: 18, failed: 4, pending: 2 };
  const recentTestsList = recentTests || [
    { id: '1', workflow_type: 'login', status: 'success', created_at: '2023-09-12T10:30:00Z', result: 'Login successful' },
    { id: '2', workflow_type: 'search', status: 'failed', created_at: '2023-09-12T09:45:00Z', result: 'Search element not found' },
    { id: '3', workflow_type: 'add_to_cart', status: 'success', created_at: '2023-09-12T08:15:00Z', result: 'Item added to cart' },
    { id: '4', workflow_type: 'login', status: 'pending', created_at: '2023-09-12T07:30:00Z', result: 'In progress' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#4caf50';
      case 'failed': return '#f44336';
      case 'pending': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  return (
    <Layout title="Dashboard Overview">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          E-commerce Test Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Monitor and manage your e-commerce automation workflows
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Tests
              </Typography>
              <Typography variant="h4" component="div">
                {summaryLoading ? <CircularProgress size={24} /> : summary.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Successful
              </Typography>
              <Typography variant="h4" component="div" sx={{ color: '#2e7d32' }}>
                {summaryLoading ? <CircularProgress size={24} /> : summary.success}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffebee' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Failed
              </Typography>
              <Typography variant="h4" component="div" sx={{ color: '#c62828' }}>
                {summaryLoading ? <CircularProgress size={24} /> : summary.failed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff8e1' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" component="div" sx={{ color: '#ef6c00' }}>
                {summaryLoading ? <CircularProgress size={24} /> : summary.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button 
              variant="contained" 
              onClick={() => router.push('/dashboard/test-runner')}
              aria-label="Run New Test"
            >
              Run New Test
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              onClick={() => router.push('/dashboard/history')}
              aria-label="View Test History"
            >
              View Test History
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Recent Tests */}
      <Box sx={{ mb: 4, flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          Recent Tests
        </Typography>
        <Paper sx={{ p: 0, overflow: 'auto' }}>
          {testsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ minWidth: 650 }}>
              <Box sx={{ display: 'flex', p: 2, borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                <Typography sx={{ flex: '1 1 20%', fontWeight: 'bold' }}>Workflow Type</Typography>
                <Typography sx={{ flex: '1 1 20%', fontWeight: 'bold' }}>Status</Typography>
                <Typography sx={{ flex: '1 1 30%', fontWeight: 'bold' }}>Result</Typography>
                <Typography sx={{ flex: '1 1 20%', fontWeight: 'bold' }}>Date</Typography>
                <Typography sx={{ flex: '1 1 10%', fontWeight: 'bold' }}>Actions</Typography>
              </Box>
              {recentTestsList.map((test) => (
                <Box 
                  key={test.id} 
                  sx={{ 
                    display: 'flex', 
                    p: 2, 
                    borderBottom: '1px solid rgba(224, 224, 224, 1)',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                  }}
                >
                  <Typography sx={{ flex: '1 1 20%' }}>{test.workflow_type}</Typography>
                  <Box sx={{ flex: '1 1 20%', display: 'flex', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        bgcolor: getStatusColor(test.status),
                        mr: 1,
                      }} 
                    />
                    <Typography>{test.status}</Typography>
                  </Box>
                  <Typography sx={{ flex: '1 1 30%' }}>{test.result}</Typography>
                  <Typography sx={{ flex: '1 1 20%' }}>
                    {new Date(test.created_at).toLocaleString()}
                  </Typography>
                  <Box sx={{ flex: '1 1 10%' }}>
                    <Button 
                      size="small" 
                      onClick={() => router.push(`/dashboard/test-details/${test.id}`)}
                      aria-label={`View details for test ${test.id}`}
                    >
                      View
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Box>
    </Layout>
  );
}