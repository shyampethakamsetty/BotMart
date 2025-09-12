import React, { useState } from 'react';
import { Box, Paper, Typography, Chip, IconButton, Tooltip, TextField } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source?: string;
}

interface TestLogViewerProps {
  logs: LogEntry[];
  title?: string;
}

const TestLogViewer: React.FC<TestLogViewerProps> = ({ logs, title = 'Test Logs' }) => {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filter logs based on level and search query
  const filteredLogs = logs.filter(log => {
    const matchesLevel = filter === 'all' || log.level === filter;
    const matchesSearch = searchQuery === '' || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.source && log.source.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  // Get log level color
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'primary';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'debug': return 'default';
      default: return 'default';
    }
  };

  // Handle copy logs to clipboard
  const handleCopyLogs = () => {
    const logText = filteredLogs
      .map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n');
    navigator.clipboard.writeText(logText);
  };

  // Handle download logs
  const handleDownloadLogs = () => {
    const logText = filteredLogs
      .map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 2, 
        mb: 3, 
        maxHeight: '500px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Box>
          <Tooltip title="Toggle Filters">
            <IconButton onClick={() => setShowFilters(!showFilters)} size="small">
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Copy Logs">
            <IconButton onClick={handleCopyLogs} size="small">
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download Logs">
            <IconButton onClick={handleDownloadLogs} size="small">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {showFilters && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip 
            label="All" 
            onClick={() => setFilter('all')} 
            variant={filter === 'all' ? 'filled' : 'outlined'}
            color={filter === 'all' ? 'primary' : 'default'}
          />
          <Chip 
            label="Info" 
            onClick={() => setFilter('info')} 
            variant={filter === 'info' ? 'filled' : 'outlined'}
            color={filter === 'info' ? 'primary' : 'default'}
          />
          <Chip 
            label="Warning" 
            onClick={() => setFilter('warning')} 
            variant={filter === 'warning' ? 'filled' : 'outlined'}
            color={filter === 'warning' ? 'primary' : 'default'}
          />
          <Chip 
            label="Error" 
            onClick={() => setFilter('error')} 
            variant={filter === 'error' ? 'filled' : 'outlined'}
            color={filter === 'error' ? 'primary' : 'default'}
          />
          <Chip 
            label="Debug" 
            onClick={() => setFilter('debug')} 
            variant={filter === 'debug' ? 'filled' : 'outlined'}
            color={filter === 'debug' ? 'primary' : 'default'}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
            <TextField
              size="small"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              sx={{ width: '200px' }}
            />
          </Box>
        </Box>
      )}

      <Box 
        sx={{ 
          overflow: 'auto',
          flex: 1,
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
          p: 1,
          borderRadius: 1
        }}
      >
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log, index) => (
            <Box 
              key={index} 
              sx={{ 
                py: 0.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': { borderBottom: 'none' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography 
                  variant="caption" 
                  sx={{ color: 'text.secondary' }}
                >
                  {log.timestamp}
                </Typography>
                <Chip 
                  label={log.level.toUpperCase()} 
                  size="small" 
                  color={getLevelColor(log.level) as any}
                  sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                />
                {log.source && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      bgcolor: 'background.paper', 
                      px: 1, 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    {log.source}
                  </Typography>
                )}
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 0.5, 
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {log.message}
              </Typography>
            </Box>
          ))
        ) : (
          <Typography variant="body2" sx={{ p: 2, color: 'text.secondary', textAlign: 'center' }}>
            No logs matching the current filters
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default TestLogViewer;