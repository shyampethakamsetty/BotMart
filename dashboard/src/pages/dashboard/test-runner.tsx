import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useMutation } from 'react-query';
import axios from 'axios';
import Layout from '@/components/Layout';
import WorkflowProgressDisplay from '@/components/WorkflowProgressDisplay';

// Types
interface TestConfig {
  workflow_type: string;
  target_url: string;
  username?: string;
  password?: string;
  // New advanced search filters
  category?: string;
  price_min?: number;
  price_max?: number;
  brand?: string;
  sort_by?: string;
  // Legacy fields
  search_query?: string;
  product_url?: string;
}

interface TestResult {
  id: string;
  status: string;
  result: string;
  screenshots: string[];
  logs: string[];
  created_at: string;
}

export default function TestRunner() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [testConfig, setTestConfig] = useState<TestConfig>({
    workflow_type: 'login',
    target_url: 'https://demo.nopcommerce.com',
    username: '',
    password: '',
    // New search filters
    category: '',
    price_min: undefined,
    price_max: undefined,
    brand: '',
    sort_by: 'default',
    // Legacy fields
    search_query: '',
    product_url: '',
  });
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState('');
  const [pollingId, setPollingId] = useState<string | null>(null);

  // Check for authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Run test mutation
  const { mutate: runTest, isLoading } = useMutation(
    async (config: TestConfig) => {
      const response = await axios.post('/api/workflows/run', config, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data as TestResult;
    },
    {
      onSuccess: (data) => {
        setTestResult(data);
        setActiveStep(2);
        setPollingId(data.id);
      },
      onError: (err: any) => {
        setError(err.response?.data?.detail || 'Failed to run test');
      },
    }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setTestConfig((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleWorkflowTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const workflowType = e.target.value;
    setTestConfig((prev) => ({ ...prev, workflow_type: workflowType }));
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleRunTest = () => {
    setError('');
    runTest(testConfig);
  };

  const handleReset = () => {
    setActiveStep(0);
    setTestResult(null);
    setError('');
  };

  const steps = ['Select Workflow Type', 'Configure Test Parameters', 'View Results'];

  const getAlertSeverity = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'success') return 'success';
    if (s === 'pending' || s === 'queued' || s === 'running') return 'info';
    return 'error';
  };

  const getAlertText = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'success') return 'Test completed successfully';
    if (s === 'pending' || s === 'queued' || s === 'running') return 'Test queued';
    return 'Test failed';
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Workflow Type</FormLabel>
              <RadioGroup
                aria-label="workflow-type"
                name="workflow_type"
                value={testConfig.workflow_type}
                onChange={handleWorkflowTypeChange}
              >
                <FormControlLabel value="login" control={<Radio />} label="Login Test" />
                <FormControlLabel value="search" control={<Radio />} label="Search Test" />
                <FormControlLabel value="add_to_cart" control={<Radio />} label="Add to Cart Test" />
              </RadioGroup>
            </FormControl>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Workflow Description
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                {testConfig.workflow_type === 'login' && (
                  <Typography>
                    Tests the login functionality of an e-commerce website. The test will navigate to the
                    login page, enter credentials, and verify successful login.
                  </Typography>
                )}
                {testConfig.workflow_type === 'search' && (
                  <Typography>
                    Tests the advanced product filtering functionality of an e-commerce website. The test will 
                    navigate to product categories, apply filters (price range, brand, sorting), and verify 
                    filtered results are displayed correctly.
                  </Typography>
                )}
                {testConfig.workflow_type === 'add_to_cart' && (
                  <Typography>
                    Tests the add to cart functionality of an e-commerce website. The test will navigate to
                    a product page and attempt to add the product to the cart.
                  </Typography>
                )}
              </Paper>
            </Box>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Target URL"
                  name="target_url"
                  value={testConfig.target_url}
                  onChange={handleInputChange}
                  helperText="The base URL of the e-commerce website"
                  aria-label="Target URL"
                />
              </Grid>

              {(testConfig.workflow_type === 'login' || testConfig.workflow_type === 'search' || testConfig.workflow_type === 'add_to_cart') && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      required
                      fullWidth
                      label="Username/Email"
                      name="username"
                      value={testConfig.username}
                      onChange={handleInputChange}
                      helperText={testConfig.workflow_type !== 'login' ? "Required for login step" : ""}
                      aria-label="Username"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      required
                      fullWidth
                      label="Password"
                      name="password"
                      type="password"
                      value={testConfig.password}
                      onChange={handleInputChange}
                      helperText={testConfig.workflow_type !== 'login' ? "Required for login step" : ""}
                      aria-label="Password"
                    />
                  </Grid>
                </>
              )}

              {testConfig.workflow_type === 'search' && (
                <>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        name="category"
                        value={testConfig.category || ''}
                        onChange={handleInputChange}
                        label="Category"
                      >
                        <MenuItem value="">All Categories</MenuItem>
                        <MenuItem value="computers">Computers</MenuItem>
                        <MenuItem value="desktops">Desktops</MenuItem>
                        <MenuItem value="notebooks">Notebooks</MenuItem>
                        <MenuItem value="electronics">Electronics</MenuItem>
                        <MenuItem value="camera-photo">Camera & Photo</MenuItem>
                        <MenuItem value="cell-phones">Cell Phones</MenuItem>
                        <MenuItem value="apparel">Apparel</MenuItem>
                        <MenuItem value="books">Books</MenuItem>
                        <MenuItem value="jewelry">Jewelry</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Min Price"
                      name="price_min"
                      type="number"
                      value={testConfig.price_min || ''}
                      onChange={handleInputChange}
                      inputProps={{ min: 0, step: 0.01 }}
                      helperText="Minimum price"
                    />
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Max Price"
                      name="price_max"
                      type="number"
                      value={testConfig.price_max || ''}
                      onChange={handleInputChange}
                      inputProps={{ min: 0, step: 0.01 }}
                      helperText="Maximum price"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                      label="Brand"
                      name="brand"
                      value={testConfig.brand || ''}
                    onChange={handleInputChange}
                      helperText="Filter by brand name"
                  />
                </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Sort By</InputLabel>
                      <Select
                        name="sort_by"
                        value={testConfig.sort_by || 'default'}
                        onChange={handleInputChange}
                        label="Sort By"
                      >
                        <MenuItem value="default">Default</MenuItem>
                        <MenuItem value="name_asc">Name: A to Z</MenuItem>
                        <MenuItem value="name_desc">Name: Z to A</MenuItem>
                        <MenuItem value="price_asc">Price: Low to High</MenuItem>
                        <MenuItem value="price_desc">Price: High to Low</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}

              {testConfig.workflow_type === 'add_to_cart' && (
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Product URL"
                    name="product_url"
                    value={testConfig.product_url}
                    onChange={handleInputChange}
                    helperText="The URL of the product to add to cart"
                    aria-label="Product URL"
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <CircularProgress size={60} />
                <Typography sx={{ mt: 2 }}>Running test...</Typography>
              </Box>
            ) : testResult ? (
              <Box>
                <Alert 
                  severity={getAlertSeverity(testResult.status) as any}
                  sx={{ mb: 3 }}
                >
                  {getAlertText(testResult.status)}
                </Alert>
                {/* show a waiting message if the test is still running */}
                {(testResult.status === 'pending' || testResult.status === 'queued' || testResult.status === 'running') && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    <Typography variant="body2">Waiting for result...</Typography>
                  </Box>
                )}

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
                        <Typography variant="body1">{testResult.id}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Date
                        </Typography>
                        <Typography variant="body1">
                          {new Date(testResult.created_at).toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Result
                        </Typography>
                        <Typography variant="body1">{testResult.result}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <WorkflowProgressDisplay 
                  workflowType={testConfig?.workflow_type || 'login'}
                  screenshots={testResult?.screenshots || []}
                  status={testResult?.status || 'pending'}
                />

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Logs</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        bgcolor: '#f5f5f5', 
                        maxHeight: 300, 
                        overflow: 'auto',
                        fontFamily: 'monospace',
                      }}
                    >
                      {testResult.logs && testResult.logs.length > 0 ? (
                        testResult.logs.map((log, index) => (
                          <Typography key={index} variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {log}
                          </Typography>
                        ))
                      ) : (
                        <Typography>No logs available</Typography>
                      )}
                    </Paper>
                  </AccordionDetails>
                </Accordion>
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <Typography>No test results yet. Configure and run a test.</Typography>
            )}
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  // Poll task status when we have a task id
  useEffect(() => {
    if (!pollingId) return;

    const controller = new AbortController();
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/workflows/task/${pollingId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          signal: controller.signal,
        });
        const data = res.data as Partial<TestResult> & { status: string };
        setTestResult((prev) => ({
          id: prev?.id || pollingId,
          status: data.status || prev?.status || 'pending',
          result: typeof data.result === 'string' ? data.result : JSON.stringify(data.result || prev?.result || ''),
          screenshots: (data as any).screenshots || prev?.screenshots || [],
          logs: (data as any).logs || prev?.logs || [],
          created_at: prev?.created_at || new Date().toISOString(),
        }));

        const s = (data.status || '').toLowerCase();
        if (s === 'success' || s === 'failed') {
          clearInterval(interval);
          setPollingId(null);
        }
      } catch (e) {
        // ignore transient errors
      }
    }, 2000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [pollingId]);

  return (
    <Layout title="Test Runner">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          E-commerce Test Runner
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Configure and run automated tests for your e-commerce website
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {getStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          {activeStep !== 0 && (
            <Button onClick={handleBack} sx={{ mr: 1 }} disabled={isLoading}>
              Back
            </Button>
          )}

          {activeStep === steps.length - 1 ? (
            <Button variant="contained" onClick={handleReset} disabled={isLoading}>
              Run Another Test
            </Button>
          ) : activeStep === 1 ? (
            <Button variant="contained" onClick={handleRunTest} disabled={isLoading}>
              Run Test
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Layout>
  );
}