// CreateAnnouncementModal.jsx
import React, { useState } from 'react';
import { useCreateAnnouncementMutation } from './announcementApi';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
  Typography,
} from '@mui/material';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PriorityHigh, Schedule, Visibility } from '@mui/icons-material';

const CreateAnnouncementModal = ({ open, onClose }) => {
  const [createAnnouncement, { isLoading, error }] = useCreateAnnouncementMutation();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    visible_to: 'all',
    start_time: null,
    end_time: null,
    is_active: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAnnouncement(formData).unwrap();
      onClose();
      setFormData({
        title: '',
        content: '',
        priority: 'medium',
        visible_to: 'all',
        start_time: null,
        end_time: null,
        is_active: true,
      });
    } catch (err) {
      console.error('Failed to create announcement:', err);
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target ? event.target.value : event;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div" fontWeight="bold">
          Create New Announcement
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Broadcast an important message to users
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to create announcement: {error.message}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={handleChange('title')}
                required
                placeholder="Enter announcement title"
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Content"
                value={formData.content}
                onChange={handleChange('content')}
                required
                multiline
                rows={4}
                placeholder="Enter announcement content"
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={handleChange('priority')}
                  label="Priority"
                  startAdornment={<PriorityHigh sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Visible To</InputLabel>
                <Select
                  value={formData.visible_to}
                  onChange={handleChange('visible_to')}
                  label="Visible To"
                  startAdornment={<Visibility sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value="all">All Users</MenuItem>
                  <MenuItem value="vendor">Vendors</MenuItem>
                  <MenuItem value="reseller">Resellers</MenuItem>
                  <MenuItem value="stockist">Stockists</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <DateTimePicker
                      label="Start Time (Optional)"
                      value={formData.start_time}
                      onChange={handleChange('start_time')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: <Schedule sx={{ mr: 1, color: 'text.secondary' }} />,
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DateTimePicker
                      label="End Time (Optional)"
                      value={formData.end_time}
                      onChange={handleChange('end_time')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: <Schedule sx={{ mr: 1, color: 'text.secondary' }} />,
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active')(e.target.checked)}
                    color="primary"
                  />
                }
                label="Active Announcement"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={onClose} variant="outlined" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !formData.title || !formData.content}
            sx={{
              background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
              borderRadius: 2,
              px: 4,
            }}
          >
            {isLoading ? 'Creating...' : 'Create Announcement'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateAnnouncementModal;