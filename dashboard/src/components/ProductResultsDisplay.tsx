import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Typography,
  Chip,
  Rating,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FilterListIcon from '@mui/icons-material/FilterList';

interface Product {
  title: string;
  price: string;
  old_price?: string;
  numeric_price: number;
  image_url: string;
  product_url: string;
  rating: number;
  availability: string;
}

interface ProductSearchResult {
  products: Product[];
  total_products: number;
  current_page: number;
  total_pages: number;
  category?: string;
  filters_applied: {
    category?: string;
    price_min?: number;
    price_max?: number;
    brand?: string;
    sort_by?: string;
  };
  screenshots: string[];
}

interface ProductResultsDisplayProps {
  result: ProductSearchResult;
  showDetails?: boolean;
}

const ProductResultsDisplay: React.FC<ProductResultsDisplayProps> = ({ 
  result, 
  showDetails = true 
}) => {
  const { products, total_products, filters_applied, screenshots } = result;

  const formatPrice = (priceStr: string) => {
    // Clean and format price display
    return priceStr.replace(/^\$/, '$');
  };

  const getDiscountPercentage = (currentPrice: string, oldPrice: string) => {
    try {
      const current = parseFloat(currentPrice.replace(/[^0-9.]/g, ''));
      const old = parseFloat(oldPrice.replace(/[^0-9.]/g, ''));
      if (old > current) {
        return Math.round(((old - current) / old) * 100);
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return 0;
  };

  return (
    <Box>
      {/* Search Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <FilterListIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Search Results Summary</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">Total Products</Typography>
              <Typography variant="h6">{total_products}</Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">Category</Typography>
              <Typography variant="body1">
                {filters_applied.category || 'All Categories'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">Price Range</Typography>
              <Typography variant="body1">
                {filters_applied.price_min || filters_applied.price_max 
                  ? `$${filters_applied.price_min || '0'} - $${filters_applied.price_max || '∞'}`
                  : 'Any Price'
                }
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">Sort Order</Typography>
              <Typography variant="body1">
                {filters_applied.sort_by === 'price_asc' ? 'Price: Low to High' :
                 filters_applied.sort_by === 'price_desc' ? 'Price: High to Low' :
                 filters_applied.sort_by === 'name_asc' ? 'Name: A to Z' :
                 filters_applied.sort_by === 'name_desc' ? 'Name: Z to A' :
                 'Default'}
              </Typography>
            </Grid>
          </Grid>

          {/* Applied Filters */}
          {(filters_applied.category || filters_applied.brand || filters_applied.price_min || filters_applied.price_max) && (
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Applied Filters:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {filters_applied.category && (
                  <Chip label={`Category: ${filters_applied.category}`} size="small" color="primary" />
                )}
                {filters_applied.brand && (
                  <Chip label={`Brand: ${filters_applied.brand}`} size="small" color="primary" />
                )}
                {filters_applied.price_min && (
                  <Chip label={`Min: $${filters_applied.price_min}`} size="small" color="primary" />
                )}
                {filters_applied.price_max && (
                  <Chip label={`Max: $${filters_applied.price_max}`} size="small" color="primary" />
                )}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Product Results */}
      {showDetails && products.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <ShoppingCartIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Product Results ({products.length})</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {products.map((product, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Product Image */}
                    {product.image_url && (
                      <CardMedia
                        component="img"
                        height="200"
                        image={product.image_url}
                        alt={product.title}
                        sx={{ objectFit: 'contain', p: 1 }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    
                    <CardContent sx={{ flexGrow: 1 }}>
                      {/* Product Title */}
                      <Typography 
                        variant="subtitle1" 
                        component="h3" 
                        gutterBottom
                        sx={{ 
                          fontWeight: 'medium',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '48px'
                        }}
                      >
                        {product.title}
                      </Typography>

                      {/* Rating */}
                      {product.rating > 0 && (
                        <Box display="flex" alignItems="center" mb={1}>
                          <Rating value={product.rating} readOnly size="small" />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            ({product.rating})
                          </Typography>
                        </Box>
                      )}

                      {/* Price */}
                      <Box mb={1}>
                        <Typography variant="h6" color="primary" component="span">
                          {formatPrice(product.price)}
                        </Typography>
                        {product.old_price && product.old_price !== product.price && (
                          <Box display="inline" ml={1}>
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              component="span"
                              sx={{ textDecoration: 'line-through' }}
                            >
                              {formatPrice(product.old_price)}
                            </Typography>
                            <Chip 
                              label={`-${getDiscountPercentage(product.price, product.old_price)}%`}
                              size="small" 
                              color="error" 
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        )}
                      </Box>

                      {/* Availability */}
                      <Chip 
                        label={product.availability}
                        size="small"
                        color={product.availability.toLowerCase().includes('stock') ? 'success' : 'default'}
                        sx={{ mb: 1 }}
                      />

                      {/* Product URL */}
                      {product.product_url && (
                        <Button
                          size="small"
                          variant="outlined"
                          href={product.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ mt: 'auto' }}
                        >
                          View Product
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* No Products Found */}
      {products.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Products Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters or search criteria
          </Typography>
        </Paper>
      )}

      {/* Screenshots */}
      {screenshots && screenshots.length > 0 && (
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Test Screenshots</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {screenshots.map((screenshot, index) => (
                <Grid item xs={12} md={6} key={index}>
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
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
};

export default ProductResultsDisplay; 