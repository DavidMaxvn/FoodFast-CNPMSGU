import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  FlightTakeoff,
  LocationOn,
  Restaurant,
  AccessTime,
  GpsFixed,
  Timeline,
  Refresh,
  PlayArrow,
  Pause,
  Stop,
} from '@mui/icons-material';
import { getDeliveryTracking, DeliveryTrackingResponse } from '../services/order';

interface DeliveryTrackingProps {
  orderId: number;
  onComplete?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const DeliveryTracking: React.FC<DeliveryTrackingProps> = ({
  orderId,
  onComplete,
  autoRefresh = true,
  refreshInterval = 5000,
}) => {
  const [trackingData, setTrackingData] = useState<DeliveryTrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(autoRefresh);

  const fetchTrackingData = async () => {
    try {
      setError(null);
      const data = await getDeliveryTracking(orderId);
      setTrackingData(data);
      
      // Gọi callback khi delivery hoàn thành
      if (data.status === 'DELIVERED' && onComplete) {
        onComplete();
      }
    } catch (err) {
      setError('Không thể tải thông tin tracking');
      console.error('Error fetching tracking data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [orderId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isAutoRefreshing && trackingData?.status !== 'DELIVERED') {
      interval = setInterval(fetchTrackingData, refreshInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAutoRefreshing, refreshInterval, trackingData?.status]);

  const handleRefresh = () => {
    setLoading(true);
    fetchTrackingData();
  };

  const toggleAutoRefresh = () => {
    setIsAutoRefreshing(!isAutoRefreshing);
  };

  if (loading && !trackingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !trackingData) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={handleRefresh}>
          Thử lại
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  if (!trackingData) {
    return (
      <Alert severity="warning">
        Không có thông tin tracking cho đơn hàng này
      </Alert>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return 'info';
      case 'IN_TRANSIT': return 'warning';
      case 'DELIVERED': return 'success';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return 'Đã gán drone';
      case 'IN_TRANSIT': return 'Đang giao hàng';
      case 'DELIVERED': return 'Đã giao hàng';
      default: return status;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header với controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GpsFixed color="primary" />
          <Typography variant="h6">Theo dõi giao hàng</Typography>
          <Chip
            label={`Drone #${trackingData.droneId}`}
            color="primary"
            icon={<FlightTakeoff />}
            size="small"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={isAutoRefreshing ? 'Tắt tự động cập nhật' : 'Bật tự động cập nhật'}>
            <IconButton onClick={toggleAutoRefresh} color={isAutoRefreshing ? 'primary' : 'default'}>
              {isAutoRefreshing ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Làm mới">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Status Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Trạng thái giao hàng
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={getStatusText(trackingData.status)}
                    color={getStatusColor(trackingData.status) as any}
                    icon={<Timeline />}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime fontSize="small" color="primary" />
                  <Typography variant="body2">
                    <strong>Dự kiến đến:</strong> {new Date(trackingData.estimatedArrival).toLocaleString('vi-VN')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GpsFixed fontSize="small" color="primary" />
                  <Typography variant="body2">
                    <strong>Vị trí hiện tại:</strong> {trackingData.currentLat.toFixed(6)}, {trackingData.currentLng.toFixed(6)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Progress Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Tiến độ giao hàng
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Tiến độ</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {Math.round(trackingData.progress)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={trackingData.progress}
                  sx={{ height: 8, borderRadius: 1 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {trackingData.status === 'DELIVERED' ? 'Giao hàng hoàn tất' : 'Đang di chuyển...'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Simulated Map */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Bản đồ giả lập (Real-time Simulation)
              </Typography>
              <Box
                sx={{
                  height: 400,
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  border: '2px solid',
                  borderColor: 'grey.200',
                  overflow: 'hidden',
                }}
              >
                {/* Background grid */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `
                      linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                  }}
                />

                {/* Route line */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '15%',
                    right: '15%',
                    height: 4,
                    bgcolor: 'primary.light',
                    transform: 'translateY(-50%)',
                    borderRadius: 2,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: `${trackingData.progress}%`,
                      height: '100%',
                      bgcolor: 'primary.main',
                      borderRadius: 2,
                      transition: 'width 0.5s ease',
                    }
                  }}
                />

                {/* Start point (Restaurant) */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: '15%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: 'success.main',
                      borderRadius: '50%',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 2,
                    }}
                  >
                    <Restaurant sx={{ fontSize: 24, color: 'white' }} />
                  </Box>
                  <Typography variant="caption" fontWeight="bold">Cửa hàng</Typography>
                </Box>

                {/* Drone position */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: `${15 + (trackingData.progress * 0.7)}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    transition: 'left 0.5s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: 'primary.main',
                      borderRadius: '50%',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 3,
                      animation: trackingData.status === 'IN_TRANSIT' ? 'pulse 2s infinite' : 'none',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.1)' },
                        '100%': { transform: 'scale(1)' },
                      },
                    }}
                  >
                    <FlightTakeoff sx={{ fontSize: 28, color: 'white' }} />
                  </Box>
                  <Typography variant="caption" fontWeight="bold">
                    Drone #{trackingData.droneId}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {Math.round(trackingData.progress)}%
                  </Typography>
                </Box>

                {/* End point (Customer) */}
                <Box
                  sx={{
                    position: 'absolute',
                    right: '15%',
                    top: '50%',
                    transform: 'translate(50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: trackingData.status === 'DELIVERED' ? 'success.main' : 'error.main',
                      borderRadius: '50%',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 2,
                    }}
                  >
                    <LocationOn sx={{ fontSize: 24, color: 'white' }} />
                  </Box>
                  <Typography variant="caption" fontWeight="bold">Khách hàng</Typography>
                </Box>

                {/* Status indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: 'background.paper',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    🏪 Cửa hàng → 🚁 Drone ({Math.round(trackingData.progress)}%) → 📍 Khách hàng
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Waypoints History */}
        {trackingData.waypoints && trackingData.waypoints.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Lịch sử di chuyển (5 điểm gần nhất)
                </Typography>
                <Stack spacing={1}>
                  {trackingData.waypoints.slice(-5).reverse().map((waypoint, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1,
                        bgcolor: index === 0 ? 'primary.50' : 'transparent',
                        borderRadius: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GpsFixed fontSize="small" color={index === 0 ? 'primary' : 'action'} />
                        <Typography variant="body2" fontFamily="monospace">
                          {waypoint.lat.toFixed(6)}, {waypoint.lng.toFixed(6)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(waypoint.timestamp).toLocaleString('vi-VN')}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Auto refresh indicator */}
      {isAutoRefreshing && trackingData.status !== 'DELIVERED' && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">
            Tự động cập nhật mỗi {refreshInterval / 1000} giây
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DeliveryTracking;