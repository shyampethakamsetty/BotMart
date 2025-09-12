import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import { useQuery } from 'react-query';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import Layout from '@/components/Layout';

// Types
interface TestResult {
  id: string;
  workflow_type: string;
  status: string;
  result: string;
  created_at: string;
  target_url: string;
}

export default function TestHistory() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Check for authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Fetch test history
  const { data: testResults, isLoading } = useQuery<TestResult[]>(
    ['testHistory', statusFilter, typeFilter, searchQuery],
    async () => {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.workflow_type = typeFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await axios.get('/api/workflows/history', {
        params,
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
  const mockTestResults: TestResult[] = [
    {
      id: '1',
      workflow_type: 'login',
      status: 'success',
      result: 'Login successful',
      created_at: '2023-09-12T10:30:00Z',
      target_url: 'https://example.com',
    },
    {
      id: '2',
      workflow_type: 'search',
      status: 'failed',
      result: 'Search element not found',
      created_at: '2023-09-12T09:45:00Z',
      target_url: 'https://example.com',
    },
    {
      id: '3',
      workflow_type: 'add_to_cart',
      status: 'success',
      result: 'Item added to cart',
      created_at: '2023-09-12T08:15:00Z',
      target_url: 'https://example.com/product/123',
    },
    {
      id: '4',
      workflow_type: 'login',
      status: 'pending',
      result: 'In progress',
      created_at: '2023-09-12T07:30:00Z',
      target_url: 'https://example.com',
    },
    {
      id: '5',
      workflow_type: 'search',
      status: 'success',
      result: 'Found 10 results for "shoes"',
      created_at: '2023-09-11T15:20:00Z',
      target_url: 'https://example.com',
    },
    {
      id: '6',
      workflow_type: 'add_to_cart',
      status: 'failed',
      result: 'Add to cart button not found',
      created_at: '2023-09-11T14:10:00Z',
      target_url: 'https://example.com/product/456',
    },
    {
      id: '7',
      workflow_type: 'login',
      status: 'success',
      result: 'Login successful',
      created_at: '2023-09-11T12:05:00Z',
      target_url: 'https://example.com',
    },
    {
      id: '8',
      workflow_type: 'search',
      status: 'success',
      result: 'Found 5 results for "laptop"',
      created_at: '2023-09-10T16:45:00Z',
      target_url: 'https://example.com',
    },
    {
      id: '9',
      workflow_type: 'add_to_cart',
      status: 'success',
      result: 'Item added to cart',
      created_at: '2023-09-10T11:30:00Z',
      target_url: 'https://example.com/product/789',
    },
    {
      id: '10',
      workflow_type: 'login',
      status: 'failed',
      result: 'Invalid credentials',
      created_at: '2023-09-10T09:15:00Z',
      target_url: 'https://example.com',
    },
    {
      id: '11',
      workflow_type: 'search',
      status: 'success',
      result: 'Found 8 results for "headphones"',
      created_at: '2023-09-09T14:20:00Z',
      target_url: 'https://example.com',
    },
    {
      id: '12',
      workflow_type: 'add_to_cart',
      status: 'success',
      result: 'Item added to cart',
      created_at: '2023-09-09T10:10:00Z',
      target_url: 'https://example.com/product/101',
    },
  ];

  const filteredResults = testResults || mockTestResults;

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleTypeFilterChange = (event: any) => {
    setTypeFilter(event.target.value);
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
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

  return (
    <Layout title="Test History">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Test History
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          View and analyze past test results
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by result or URL"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              aria-label="Search test results"
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    value={statusFilter}
                    label="Status"
                    onChange={handleStatusFilterChange}
                    aria-label="Filter by status"
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="success">Success</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel id="type-filter-label">Workflow Type</InputLabel>
                  <Select
                    labelId="type-filter-label"
                    value={typeFilter}
                    label="Workflow Type"
                    onChange={handleTypeFilterChange}
                    aria-label="Filter by workflow type"
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="login">Login</MenuItem>
                    <MenuItem value="search">Search</MenuItem>
                    <MenuItem value="add_to_cart">Add to Cart</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="test results table">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Workflow Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Result</TableCell>
                    <TableCell>Target URL</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredResults
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => (
                      <TableRow hover key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.workflow_type}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            color={getStatusColor(row.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{row.result}</TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              maxWidth: 200, 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap' 
                            }}
                          >
                            {row.target_url}
                          </Typography>
                        </TableCell>
                        <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => router.push(`/dashboard/test-details/${row.id}`)}
                            aria-label={`View details for test ${row.id}`}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredResults.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    </Layout>
  );
}