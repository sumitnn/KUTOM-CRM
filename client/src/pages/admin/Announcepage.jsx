
import React, { useState, lazy, Suspense } from 'react';
import {
  useGetAnnouncementsQuery,
  useDeleteAnnouncementMutation,
} from '../../features/announcement/announcementApi';

const CreateAnnouncementModal = lazy(() =>
  import('./CreateAnnouncementModal')
);
const EditAnnouncementModal = lazy(() =>
  import('./EditAnnouncementModal')
);

import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  Grid,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Warning,
  Error,
  Info,
  Notifications,
} from '@mui/icons-material';

const Announcepage = () => {
  const { data: announcements, error, isLoading } = useGetAnnouncementsQuery();
  const [deleteAnnouncement] = useDeleteAnnouncementMutation();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'success',
      medium: 'info',
      high: 'warning',
      critical: 'error',
    };
    return colors[priority] || 'default';
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      low: <Info />,
      medium: <Warning />,
      high: <Error />,
      critical: <Notifications />,
    };
    return icons[priority] || <Info />;
  };

  const handleEdit = (announcement) => {
    setSelectedAnnouncement(announcement);
    setEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteAnnouncement(id).unwrap();
      } catch (error) {
        console.error('Failed to delete announcement:', error);
      }
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading announcements: {error.message}
      </Alert>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Announcements
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateModalOpen(true)}
            sx={{
              background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
              borderRadius: 3,
              px: 3,
              py: 1,
            }}
          >
            New Announcement
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage and broadcast important messages to users
        </Typography>
      </Box>

      {/* Announcements Grid */}
      <Grid container spacing={3}>
        {announcements?.map((announcement) => (
          <Grid item xs={12} md={6} lg={4} key={announcement.id}>
            <Card
              sx={{
                p: 3,
                height: '100%',
                borderLeft: `4px solid`,
                borderColor: `${getPriorityColor(announcement.priority)}.main`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              {/* Header */}
              <Box display="flex" justifyContent="between" alignItems="flex-start" mb={2}>
                <Box flex={1}>
                  <Typography variant="h6" component="h2" fontWeight="600" gutterBottom>
                    {announcement.title}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                    <Chip
                      icon={getPriorityIcon(announcement.priority)}
                      label={announcement.priority}
                      color={getPriorityColor(announcement.priority)}
                      size="small"
                    />
                    <Chip
                      label={`Visible to: ${announcement.visible_to}`}
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={announcement.is_active ? 'Active' : 'Inactive'}
                      color={announcement.is_active ? 'success' : 'default'}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Box>
                <Box display="flex" gap={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(announcement)}
                    sx={{ color: 'primary.main' }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(announcement.id)}
                    sx={{ color: 'error.main' }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Box>

              {/* Content */}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 3,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {announcement.content}
              </Typography>

              {/* Footer */}
              <Box
                sx={{
                  pt: 2,
                  borderTop: 1,
                  borderColor: 'divider',
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                }}
              >
                <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={1}>
                  <span>Created: {formatDate(announcement.created_at)}</span>
                  {announcement.start_time && (
                    <span>Starts: {formatDate(announcement.start_time)}</span>
                  )}
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}

        {(!announcements || announcements.length === 0) && (
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                background: 'linear-gradient(45deg, #f5f5f5, #e0e0e0)',
                borderRadius: 3,
              }}
            >
              <Notifications sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No announcements yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first announcement to start broadcasting messages
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateModalOpen(true)}
              >
                Create Announcement
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Modals (lazy + Suspense) */}
      {createModalOpen && (
        <Suspense fallback={<div>Loading Create Modal...</div>}>
          <CreateAnnouncementModal
            open={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
          />
        </Suspense>
      )}

      {editModalOpen && (
        <Suspense fallback={<div>Loading Edit Modal...</div>}>
          <EditAnnouncementModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            announcement={selectedAnnouncement}
          />
        </Suspense>
      )}
    </Container>
  );
};

export default Announcepage;
