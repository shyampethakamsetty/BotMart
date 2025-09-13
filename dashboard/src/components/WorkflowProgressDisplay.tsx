import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Stepper, Step, StepLabel, Paper, Chip } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

interface WorkflowStep {
  name: string;
  icon: React.ReactNode;
  screenshots: string[];
  completed: boolean;
}

interface WorkflowProgressDisplayProps {
  workflowType: string;
  screenshots: string[];
  status: string;
}

const WorkflowProgressDisplay: React.FC<WorkflowProgressDisplayProps> = ({
  workflowType,
  screenshots,
  status
}) => {
  // Map screenshot filenames to workflow steps
  const getWorkflowSteps = (): WorkflowStep[] => {
    const steps: WorkflowStep[] = [];
    
    // Login step (always first for search and add_to_cart)
    if (workflowType === 'search' || workflowType === 'add_to_cart' || workflowType === 'login') {
      const loginScreenshots = screenshots.filter((s: string) => 
        s.includes('login-page') || s.includes('filled-login') || s.includes('after-login')
      );
      steps.push({
        name: 'Login',
        icon: <LoginIcon />,
        screenshots: loginScreenshots,
        completed: loginScreenshots.length > 0
      });
    }
    
    // Search step (for search and add_to_cart)
    if (workflowType === 'search' || workflowType === 'add_to_cart') {
      const searchScreenshots = screenshots.filter((s: string) => 
        s.includes('category-page') || s.includes('search-results')
      );
      steps.push({
        name: 'Search Products',
        icon: <SearchIcon />,
        screenshots: searchScreenshots,
        completed: searchScreenshots.length > 0
      });
    }
    
    // Add to cart step (only for add_to_cart)
    if (workflowType === 'add_to_cart') {
      const cartScreenshots = screenshots.filter(s => 
        s.includes('product-page') || s.includes('after-add-to-cart') || s.includes('cart-page')
      );
      steps.push({
        name: 'Add to Cart',
        icon: <ShoppingCartIcon />,
        screenshots: cartScreenshots,
        completed: cartScreenshots.length > 0
      });
    }
    
    return steps;
  };

  const steps = getWorkflowSteps();
  const activeStep = steps.findIndex(step => !step.completed);
  const completedSteps = activeStep === -1 ? steps.length : activeStep;

  // Get screenshot labels based on filename
  const getScreenshotLabel = (screenshotUrl: string): string => {
    const filename = screenshotUrl.split('/').pop() || '';
    
    const labelMap: Record<string, string> = {
      'login-page': 'Login Page',
      'filled-login': 'Credentials Filled',
      'after-login': 'Login Success',
      'category-page': 'Category Page',
      'search-results': 'Search Results',
      'product-page': 'Product Details',
      'after-add-to-cart': 'Added to Cart',
      'cart-page': 'Shopping Cart'
    };
    
    // Find matching label
    for (const [key, label] of Object.entries(labelMap)) {
      if (filename.includes(key)) {
        return label;
      }
    }
    
    return `Step ${filename}`;
  };

  return (
    <Box>
      {/* Workflow Progress Stepper */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Workflow Progress
        </Typography>
        <Stepper activeStep={completedSteps} alternativeLabel>
          {steps.map((step, index) => (
            <Step key={step.name} completed={step.completed}>
              <StepLabel 
                icon={step.icon}
                error={status === 'failed' && index === activeStep}
              >
                {step.name}
                <Chip 
                  size="small" 
                  label={`${step.screenshots.length} screenshots`}
                  sx={{ ml: 1, fontSize: '0.7rem' }}
                />
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Screenshots organized by workflow step */}
      {steps.map((step, stepIndex) => (
        step.screenshots.length > 0 && (
          <Paper key={step.name} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {step.icon}
              {step.name} Screenshots
            </Typography>
            <Grid container spacing={2}>
              {step.screenshots.map((screenshot, screenshotIndex) => (
                <Grid item xs={12} md={6} lg={4} key={screenshotIndex}>
                  <Card variant="outlined">
                    <CardContent sx={{ p: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {getScreenshotLabel(screenshot)}
                      </Typography>
                      <Box 
                        component="img" 
                        src={screenshot}
                        alt={getScreenshotLabel(screenshot)}
                        sx={{ 
                          width: '100%', 
                          border: '1px solid #eee',
                          borderRadius: 1,
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8
                          }
                        }}
                        onClick={() => window.open(screenshot, '_blank')}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )
      ))}

      {/* Fallback for workflows without organized screenshots */}
      {steps.every(step => step.screenshots.length === 0) && screenshots.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            All Screenshots
          </Typography>
          <Grid container spacing={2}>
            {screenshots.map((screenshot, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card variant="outlined">
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Step {index + 1}
                    </Typography>
                    <Box 
                      component="img" 
                      src={screenshot}
                      alt={`Step ${index + 1}`}
                      sx={{ 
                        width: '100%', 
                        border: '1px solid #eee',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.8
                        }
                      }}
                      onClick={() => window.open(screenshot, '_blank')}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default WorkflowProgressDisplay; 