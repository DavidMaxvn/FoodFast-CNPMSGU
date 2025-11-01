import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import { Box, Typography, CircularProgress, Alert, Chip, Avatar, Card, CardContent } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Flight, LocationOn, Battery80, Speed, Schedule } from '@mui/icons-material';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const droneIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1976d2">
      <circle cx="12" cy="12" r="2"/>
      <circle cx="4.5" cy="4.5" r="1.5" stroke="#1976d2" fill="none" stroke-width="1"/>
      <circle cx="19.5" cy="4.5" r="1.5" stroke="#1976d2" fill="none" stroke-width="1"/>
      <circle cx="4.5" cy="19.5" r="1.5" stroke="#1976d2" fill="none" stroke-width="1"/>
      <circle cx="19.5" cy="19.5" r="1.5" stroke="#1976d2" fill="none" stroke-width="1"/>
      <path d="M6 6 L10 10 M18 6 L14 10 M6 18 L10 14 M18 18 L14 14" stroke="#1976d2" stroke-width="1" fill="none"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const stationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4caf50">
      <rect x="8" y="2" width="8" height="20" rx="2"/>
      <circle cx="12" cy="7" r="2" fill="white"/>
      <rect x="10" y="12" width="4" height="2" fill="white"/>
      <rect x="10" y="16" width="4" height="2" fill="white"/>
    </svg>
  `),
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const customerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff5722">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface LocationPoint {
  lat: number;
  lng: number;
}

interface DroneData {
  id: string;
  status: string;
  currentLat: number;
  currentLng: number;
  batteryPct: number;
  assignedOrderId?: string;
  customerAddress?: string;
  etaSeconds?: number;
}

interface DroneStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  availableDrones: number;
  totalDrones: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE';
}

interface DroneMapProps {
  drones?: DroneData[];
  stations?: DroneStation[];
  selectedDroneId?: string;
  customerLocations?: { orderId: string; location: LocationPoint; customerName: string }[];
  height?: number;
  showRoutes?: boolean;
  onDroneClick?: (droneId: string) => void;
  onStationClick?: (stationId: string) => void;
}

// OSRM API service for routing
const getRoute = async (start: LocationPoint, end: LocationPoint): Promise<LocationPoint[] | null> => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
    );
    
    if (!response.ok) {
      throw new Error('OSRM API request failed');
    }
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates.map((coord: [number, number]) => ({
        lat: coord[1],
        lng: coord[0]
      }));
    }
    
    return null;
  } catch (error) {
    console.error('OSRM routing error:', error);
    return null;
  }
};

const DroneMap: React.FC<DroneMapProps> = ({
  drones = [],
  stations = [],
  selectedDroneId,
  customerLocations = [],
  height = 500,
  showRoutes = true,
  onDroneClick,
  onStationClick
}) => {
  const [routes, setRoutes] = useState<{ [droneId: string]: LocationPoint[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default center (Ho Chi Minh City)
  const defaultCenter: LocationPoint = useMemo(() => ({
    lat: 10.8231,
    lng: 106.6297
  }), []);

  // Calculate map center based on drones and stations
  const mapCenter: LocationPoint = useMemo(() => {
    const allPoints = [
      ...drones.map(d => ({ lat: d.currentLat, lng: d.currentLng })),
      ...stations.map(s => ({ lat: s.lat, lng: s.lng })),
      ...customerLocations.map(c => c.location)
    ];

    if (allPoints.length === 0) return defaultCenter;

    const avgLat = allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length;
    const avgLng = allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length;

    return { lat: avgLat, lng: avgLng };
  }, [drones, stations, customerLocations, defaultCenter]);

  // Load routes for drones with assigned orders
  const loadRoutes = useCallback(async () => {
    if (!showRoutes) return;

    setLoading(true);
    const newRoutes: { [droneId: string]: LocationPoint[] } = {};

    for (const drone of drones) {
      if (drone.assignedOrderId) {
        const customerLocation = customerLocations.find(c => c.orderId === drone.assignedOrderId);
        if (customerLocation) {
          const route = await getRoute(
            { lat: drone.currentLat, lng: drone.currentLng },
            customerLocation.location
          );
          if (route) {
            newRoutes[drone.id] = route;
          }
        }
      }
    }

    setRoutes(newRoutes);
    setLoading(false);
  }, [drones, customerLocations, showRoutes]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IDLE': return '#4caf50';
      case 'ASSIGNED': return '#ff9800';
      case 'EN_ROUTE_TO_STORE': return '#2196f3';
      case 'AT_STORE': return '#9c27b0';
      case 'EN_ROUTE_TO_CUSTOMER': return '#f44336';
      case 'ARRIVING': return '#e91e63';
      case 'RETURN_TO_BASE': return '#607d8b';
      default: return '#9e9e9e';
    }
  };

  const getStationStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'MAINTENANCE': return 'warning';
      case 'OFFLINE': return 'error';
      default: return 'default';
    }
  };

  const formatTime = (seconds: number): string => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ position: 'relative', height, width: '100%' }}>
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1000,
            bgcolor: 'white',
            p: 1,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            boxShadow: 2
          }}
        >
          <CircularProgress size={20} />
          <Typography variant="caption">Đang tải routes...</Typography>
        </Box>
      )}

      {error && (
        <Box sx={{ position: 'absolute', top: 10, left: 10, right: 10, zIndex: 1000 }}>
          <Alert severity="warning" variant="filled">
            {error}
          </Alert>
        </Box>
      )}

      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Drone Stations */}
        {stations.map((station) => (
          <React.Fragment key={station.id}>
            <Marker 
              position={{ lat: station.lat, lng: station.lng }} 
              icon={stationIcon}
              eventHandlers={{
                click: () => onStationClick?.(station.id)
              }}
            >
              <Popup>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#4caf50', mb: 1 }}>
                    🏢 {station.name}
                  </Typography>
                  <Chip 
                    label={station.status} 
                    color={getStationStatusColor(station.status) as any}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" display="block">
                    Drones khả dụng: {station.availableDrones}/{station.totalDrones}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ color: '#666' }}>
                    GPS: {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                  </Typography>
                </Box>
              </Popup>
            </Marker>
            
            {/* Station coverage area */}
            <Circle
              center={{ lat: station.lat, lng: station.lng }}
              radius={2000} // 2km radius
              pathOptions={{
                color: '#4caf50',
                fillColor: '#4caf50',
                fillOpacity: 0.1,
                weight: 1,
                dashArray: '5, 5'
              }}
            />
          </React.Fragment>
        ))}

        {/* Drones */}
        {drones.map((drone) => (
          <Marker 
            key={drone.id}
            position={{ lat: drone.currentLat, lng: drone.currentLng }} 
            icon={droneIcon}
            eventHandlers={{
              click: () => onDroneClick?.(drone.id)
            }}
          >
            <Popup>
              <Box sx={{ minWidth: 250 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
                  🚁 Drone #{drone.id}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Chip 
                    label={drone.status} 
                    size="small"
                    sx={{ 
                      bgcolor: getStatusColor(drone.status),
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                  <Chip 
                    icon={<Battery80 />}
                    label={`${drone.batteryPct}%`}
                    size="small"
                    color={drone.batteryPct > 50 ? 'success' : drone.batteryPct > 20 ? 'warning' : 'error'}
                  />
                </Box>

                {drone.assignedOrderId && (
                  <>
                    <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                      📦 Đơn hàng: #{drone.assignedOrderId}
                    </Typography>
                    {drone.customerAddress && (
                      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                        📍 Địa chỉ: {drone.customerAddress}
                      </Typography>
                    )}
                    {drone.etaSeconds && (
                      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                        ⏱️ ETA: {formatTime(drone.etaSeconds)}
                      </Typography>
                    )}
                  </>
                )}

                <Typography variant="caption" display="block" sx={{ color: '#666', mt: 1 }}>
                  GPS: {drone.currentLat.toFixed(4)}, {drone.currentLng.toFixed(4)}
                </Typography>
              </Box>
            </Popup>
          </Marker>
        ))}

        {/* Customer Locations */}
        {customerLocations.map((customer) => (
          <Marker 
            key={customer.orderId}
            position={customer.location} 
            icon={customerIcon}
          >
            <Popup>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#ff5722', mb: 1 }}>
                  🎯 Điểm giao hàng
                </Typography>
                <Typography variant="caption" display="block">
                  Đơn hàng: #{customer.orderId}
                </Typography>
                <Typography variant="caption" display="block">
                  Khách hàng: {customer.customerName}
                </Typography>
                <Typography variant="caption" display="block" sx={{ color: '#666' }}>
                  GPS: {customer.location.lat.toFixed(4)}, {customer.location.lng.toFixed(4)}
                </Typography>
              </Box>
            </Popup>
          </Marker>
        ))}

        {/* Routes */}
        {showRoutes && Object.entries(routes).map(([droneId, route]) => {
          const drone = drones.find(d => d.id === droneId);
          return (
            <Polyline
              key={droneId}
              positions={route}
              color={getStatusColor(drone?.status || 'IDLE')}
              weight={selectedDroneId === droneId ? 6 : 3}
              opacity={selectedDroneId === droneId ? 1 : 0.7}
              dashArray={selectedDroneId === droneId ? undefined : "10, 5"}
            />
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      <Card
        sx={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          zIndex: 1000,
          minWidth: 200,
          maxWidth: 300
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            📍 Chú thích
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Flight sx={{ color: '#1976d2', fontSize: 16 }} />
            <Typography variant="caption">Drone ({drones.length})</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <LocationOn sx={{ color: '#4caf50', fontSize: 16 }} />
            <Typography variant="caption">Trạm drone ({stations.length})</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LocationOn sx={{ color: '#ff5722', fontSize: 16 }} />
            <Typography variant="caption">Điểm giao hàng ({customerLocations.length})</Typography>
          </Box>
          
          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
            Powered by OpenStreetMap & OSRM
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DroneMap;