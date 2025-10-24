import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Alert,
  CircularProgress,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  GpsFixed,
  FlightTakeoff,
  FlightLand,
  Schedule,
  LocationOn,
  Person,
  Refresh,
  PlayArrow,
  Stop
} from '@mui/icons-material';
import { useWebSocket } from '../../hooks/useWebSocket';
import { droneService, ActiveDelivery, DroneGpsUpdate, DroneStateChange, DeliveryEtaUpdate } from '../../services/droneService';

// Remove duplicate interfaces since they're imported from service
const DroneTracking: React.FC = () => {
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDelivery[]>([]);
  const [droneEvents, setDroneEvents] = useState<(DroneGpsUpdate | DroneStateChange | DeliveryEtaUpdate)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket connection
  const { isConnected, subscribe, unsubscribe } = useWebSocket({
    url: 'http://localhost:8080/ws',
    onConnect: () => {
      console.log('Connected to drone tracking WebSocket');
      setError(null);
    },
    onDisconnect: () => {
      console.log('Disconnected from drone tracking WebSocket');
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection failed');
    }
  });

  // Load active deliveries
  const loadActiveDeliveries = async () => {
    try {
      setLoading(true);
      const deliveries = await droneService.getActiveDeliveries();
      setActiveDeliveries(deliveries);
      setError(null);
    } catch (err) {
      console.error('Error loading active deliveries:', err);
      setError('Failed to load active deliveries');
    } finally {
      setLoading(false);
    }
  };

  // WebSocket subscriptions
  useEffect(() => {
    if (!isConnected) return;

    const subscriptions: any[] = [];

    // Subscribe to GPS updates
    const gpsSubscription = subscribe('/topic/drone/gps', (update: DroneGpsUpdate) => {
      console.log('GPS Update:', update);
      setDroneEvents(prev => [update, ...prev.slice(0, 49)]); // Keep last 50 events
      
      // Update delivery position
      setActiveDeliveries(prev => prev.map(delivery => 
        delivery.droneId === update.droneId 
          ? { ...delivery, currentSegment: update.currentSegment, etaSeconds: update.etaSeconds }
          : delivery
      ));
    });

    // Subscribe to state changes
    const stateSubscription = subscribe('/topic/drone/state', (change: DroneStateChange) => {
      console.log('State Change:', change);
      setDroneEvents(prev => [change, ...prev.slice(0, 49)]);
      
      // Update delivery status
      setActiveDeliveries(prev => prev.map(delivery => 
        delivery.droneId === change.droneId 
          ? { ...delivery, status: change.newStatus, currentSegment: change.currentSegment }
          : delivery
      ));
    });

    // Subscribe to ETA updates
    const etaSubscription = subscribe('/topic/delivery/eta', (eta: DeliveryEtaUpdate) => {
      console.log('ETA Update:', eta);
      setDroneEvents(prev => [eta, ...prev.slice(0, 49)]);
      
      // Update delivery ETA
      setActiveDeliveries(prev => prev.map(delivery => 
        delivery.id === eta.deliveryId 
          ? { 
              ...delivery, 
              etaSeconds: eta.etaSeconds, 
              progressPercent: eta.progressPercent,
              currentSegment: eta.currentSegment 
            }
          : delivery
      ));
    });

    if (gpsSubscription) subscriptions.push(gpsSubscription);
    if (stateSubscription) subscriptions.push(stateSubscription);
    if (etaSubscription) subscriptions.push(etaSubscription);

    return () => {
      subscriptions.forEach(sub => unsubscribe(sub));
    };
  }, [isConnected, subscribe, unsubscribe]);

  // Load data on component mount
  useEffect(() => {
    loadActiveDeliveries();
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSegmentName = (segment: string): string => {
    const segments: { [key: string]: string } = {
      'W0_W1': 'Đến cửa hàng',
      'W1_W2': 'Lấy hàng',
      'W2_W3': 'Giao hàng',
      'W3_W0': 'Trở về'
    };
    return segments[segment] || segment;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'idle': return 'default';
      case 'assigned': return 'info';
      case 'en_route_to_store': return 'warning';
      case 'at_store': return 'secondary';
      case 'en_route_to_customer': return 'primary';
      case 'delivered': return 'success';
      case 'returning': return 'warning';
      default: return 'default';
    }
  };

  const getEventIcon = (event: any) => {
    if ('latitude' in event) return <GpsFixed />;
    if ('oldStatus' in event) return <FlightTakeoff />;
    if ('progressPercent' in event) return <Schedule />;
    return <LocationOn />;
  };

  const getEventDescription = (event: any) => {
    if ('latitude' in event) {
      return `GPS: ${event.latitude.toFixed(6)}, ${event.longitude.toFixed(6)} - ${event.currentSegment}`;
    }
    if ('oldStatus' in event) {
      return `Status: ${event.oldStatus} → ${event.newStatus} - ${event.message}`;
    }
    if ('progressPercent' in event) {
      return `ETA: ${formatTime(event.etaSeconds)} (${event.progressPercent}%) - ${event.currentSegment}`;
    }
    return 'Unknown event';
  };

  const handleStartDelivery = async (deliveryId: string) => {
    try {
      await droneService.startDelivery(deliveryId);
      await loadActiveDeliveries(); // Refresh data
    } catch (err) {
      console.error('Error starting delivery:', err);
      setError('Failed to start delivery');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Drone Tracking Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip 
          icon={isConnected ? <GpsFixed /> : <Stop />}
          label={isConnected ? 'Connected' : 'Disconnected'}
          color={isConnected ? 'success' : 'error'}
        />
        <Tooltip title="Refresh Data">
          <IconButton onClick={loadActiveDeliveries}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Active Deliveries */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Deliveries ({activeDeliveries.length})
            </Typography>
            
            {activeDeliveries.length === 0 ? (
              <Typography color="text.secondary">
                No active deliveries
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {activeDeliveries.map((delivery) => (
                  <Grid item xs={12} sm={6} key={delivery.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6">
                            Order #{delivery.orderId}
                          </Typography>
                          <Chip 
                            label={delivery.status}
                            color={getStatusColor(delivery.status) as any}
                            size="small"
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <FlightTakeoff sx={{ mr: 1, fontSize: 16 }} />
                          <Typography variant="body2">
                            Drone: {delivery.droneId}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                           <Person sx={{ mr: 1, fontSize: 16 }} />
                           <Typography variant="body2">
                             {delivery.customerName}
                           </Typography>
                         </Box>
                         
                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                           <LocationOn sx={{ mr: 1, fontSize: 16 }} />
                           <Typography variant="body2" noWrap>
                             {delivery.customerAddress}
                           </Typography>
                         </Box>
                         
                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                           <Schedule sx={{ mr: 1, fontSize: 16 }} />
                           <Typography variant="body2">
                             ETA: {formatTime(delivery.etaSeconds)}
                           </Typography>
                         </Box>
                         
                         <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                           Current: {delivery.currentSegment}
                         </Typography>
                         
                         <LinearProgress 
                           variant="determinate" 
                           value={delivery.progressPercent || 0} 
                           sx={{ mb: 1 }}
                         />
                         
                         <Typography variant="caption" color="text.secondary">
                           Progress: {delivery.progressPercent || 0}%
                         </Typography>
                        
                        {delivery.status === 'ASSIGNED' && (
                           <Box sx={{ mt: 1 }}>
                             <Button
                               size="small"
                               variant="contained"
                               startIcon={<PlayArrow />}
                               onClick={() => handleStartDelivery(delivery.id)}
                             >
                               Start Delivery
                             </Button>
                           </Box>
                         )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Real-time Events */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '600px', overflow: 'hidden' }}>
            <Typography variant="h6" gutterBottom>
              Real-time Events
            </Typography>
            
            <Box sx={{ height: '520px', overflow: 'auto' }}>
              {droneEvents.length === 0 ? (
                <Typography color="text.secondary">
                  No events yet
                </Typography>
              ) : (
                <List dense>
                  {droneEvents.map((event, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          {getEventIcon(event)}
                        </ListItemIcon>
                        <ListItemText
                          primary={getEventDescription(event)}
                          secondary={new Date(event.timestamp).toLocaleTimeString()}
                        />
                      </ListItem>
                      {index < droneEvents.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Map Placeholder */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Drone Locations Map
            </Typography>
            <Box 
              sx={{ 
                height: '350px', 
                backgroundColor: '#f5f5f5', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '2px dashed #ccc',
                borderRadius: 1
              }}
            >
              <Typography color="text.secondary">
                Map integration will be implemented here
                <br />
                (Google Maps, Leaflet, etc.)
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DroneTracking;