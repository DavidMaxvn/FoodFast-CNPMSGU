import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const droneIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2343/2343627.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const customerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

interface LocationPoint {
  lat: number;
  lng: number;
}

interface TrackingMapProps {
  orderId?: string;
  customerLocation?: LocationPoint;
  droneLocation?: LocationPoint;
  height?: number;
}

// OSRM API service
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
      // Convert coordinates from [lng, lat] to [lat, lng]
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

const TrackingMap: React.FC<TrackingMapProps> = ({
  orderId,
  customerLocation,
  droneLocation,
  height = 400
}) => {
  const [routeCoordinates, setRouteCoordinates] = useState<LocationPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(true);

  // Default locations for demo (Ho Chi Minh City area)
  const defaultCustomer: LocationPoint = useMemo(
    () => customerLocation || { lat: 10.8231, lng: 106.6297 },
    [customerLocation]
  );
  const defaultDrone: LocationPoint = useMemo(
    () => droneLocation || { lat: 10.8331, lng: 106.6197 },
    [droneLocation]
  );

  // Simulate drone movement for demo
  const [currentDroneLocation, setCurrentDroneLocation] = useState<LocationPoint>(defaultDrone);

  useEffect(() => {
    // Simulate drone movement every 3 seconds
    const interval = setInterval(() => {
      if (isMounted) {
        setCurrentDroneLocation(prev => ({
          lat: prev.lat + (Math.random() - 0.5) * 0.001,
          lng: prev.lng + (Math.random() - 0.5) * 0.001
        }));
      }
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [isMounted]);

  useEffect(() => {
    // Get route when locations are available
    const fetchRoute = async () => {
      if (currentDroneLocation && defaultCustomer && isMounted) {
        setLoading(true);
        setError(null);
        
        try {
          const route = await getRoute(currentDroneLocation, defaultCustomer);
          
          if (isMounted) {
            if (route) {
              setRouteCoordinates(route);
            } else {
              setError('Không thể tải route từ OSRM API');
            }
            setLoading(false);
          }
        } catch (err) {
          if (isMounted) {
            setError('Không thể tải route từ OSRM API');
            setLoading(false);
          }
        }
      }
    };

    fetchRoute();
  }, [currentDroneLocation, defaultCustomer, isMounted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Calculate map center
  const mapCenter: LocationPoint = useMemo(
    () => ({
      lat: (currentDroneLocation.lat + defaultCustomer.lat) / 2,
      lng: (currentDroneLocation.lng + defaultCustomer.lng) / 2
    }),
    [currentDroneLocation, defaultCustomer]
  );

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
            gap: 1
          }}
        >
          <CircularProgress size={20} />
          <Typography variant="caption">Đang tải route...</Typography>
        </Box>
      )}

      {error && (
        <Box sx={{ position: 'absolute', top: 10, left: 10, right: 10, zIndex: 1000 }}>
          <Alert severity="warning" variant="filled">
            {error}
          </Alert>
        </Box>
      )}

      {isMounted && (
        <MapContainer
          center={mapCenter}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          key={`map-${orderId || 'default'}`} // Force remount when orderId changes
        >
          {/* OpenStreetMap Tile Layer - MIỄN PHÍ */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Drone Marker */}
          <Marker position={currentDroneLocation} icon={droneIcon}>
            <Popup>
              <Box>
                <Typography variant="subtitle2">🚁 Drone Giao Hàng</Typography>
                <Typography variant="caption">
                  Đơn hàng: #{orderId || 'DEMO'}
                </Typography>
                <br />
                <Typography variant="caption">
                  Vị trí: {currentDroneLocation.lat.toFixed(4)}, {currentDroneLocation.lng.toFixed(4)}
                </Typography>
              </Box>
            </Popup>
          </Marker>

          {/* Customer Marker */}
          <Marker position={defaultCustomer} icon={customerIcon}>
            <Popup>
              <Box>
                <Typography variant="subtitle2"> Địa Chỉ Giao Hàng</Typography>
                <Typography variant="caption">
                  Khách hàng đang chờ
                </Typography>
                <br />
                <Typography variant="caption">
                  Vị trí: {defaultCustomer.lat.toFixed(4)}, {defaultCustomer.lng.toFixed(4)}
                </Typography>
              </Box>
            </Popup>
          </Marker>

          {/* Route Polyline */}
          {routeCoordinates.length > 0 && (
            <Polyline
              positions={routeCoordinates}
              color="#2196f3"
              weight={4}
              opacity={0.7}
            />
          )}
        </MapContainer>
      )}

      {/* Map Info */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          p: 1,
          borderRadius: 1,
          zIndex: 1000
        }}
      >
        <Typography variant="caption" display="block">
          OpenStreetMap 
        </Typography>
        <Typography variant="caption" display="block">
           OSRM Routing API
        </Typography>
        <Typography variant="caption" display="block">
           Real-time GPS Simulation
        </Typography>
      </Box>
    </Box>
  );
};

export default TrackingMap;