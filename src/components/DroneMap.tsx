import React, { useMemo } from 'react';
import { Box, Paper, Typography, Chip, Stack } from '@mui/material';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type DroneItem = {
  id: string;
  status: string;
  currentLat?: number | null;
  currentLng?: number | null;
  homeLat?: number | null;
  homeLng?: number | null;
  batteryPct: number;
  assignedOrderId?: string;
};

type StationItem = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  availableDrones: number;
  totalDrones: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE';
};

interface Waypoint {
  lat: number;
  lng: number;
  type?: 'PICKUP' | 'DELIVERY' | 'RETURN' | string;
}

interface DroneMapProps {
  drones: DroneItem[];
  stations: StationItem[];
  height?: number;
  showRoutes?: boolean;
  onDroneClick?: (droneId: string) => void;
  onStationClick?: (stationId: string) => void;
  selectedDroneId?: string;
  route?: Waypoint[]; // waypoints for route (if any)
}

// Helper component to fit map bounds when points change
const FitBounds: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  React.useEffect(() => {
    if (!map) return;
    if (!points || points.length === 0) return;
    try {
      if (points.length === 1) {
        // single point: set view to city-level zoom
        map.setView(points[0] as any, 13);
      } else {
        map.fitBounds(points as any, { padding: [60, 60] });
      }
    } catch (e) {
      // ignore
    }
  }, [map, points]);
  return null;
};

const statusToColor = (status: string) => {
  switch (status) {
    case 'IDLE':
      return '#4caf50';
    case 'DELIVERING':
    case 'EN_ROUTE_TO_CUSTOMER':
    case 'EN_ROUTE_TO_STORE':
      return '#ff9800';
    case 'RETURNING':
      return '#2196f3';
    case 'CHARGING':
      return '#9e9e9e';
    case 'MAINTENANCE':
      return '#f44336';
    case 'OFFLINE':
      return '#757575';
    default:
      return '#607d8b';
  }
};

const DroneMap: React.FC<DroneMapProps> = ({
  drones,
  stations,
  height = 400,
  showRoutes = false,
  onDroneClick,
  onStationClick,
  selectedDroneId,
  route
}) => {
  // Default center (Ho Chi Minh City) and default zoom
  const defaultCenter: [number, number] = [10.776530, 106.700981];
  const defaultZoom = 13;

  // Prepare points to fit bounds: drones, stations, route
  const points = useMemo(() => {
    const pts: [number, number][] = [];
    drones.forEach(d => {
      const lat = Number(d.currentLat ?? d.homeLat ?? NaN);
      const lng = Number(d.currentLng ?? d.homeLng ?? NaN);
      // exclude invalid coordinates and the (0,0) null island
      if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) pts.push([lat, lng]);
    });
    stations.forEach(s => {
      if (Number.isFinite(s.lat) && Number.isFinite(s.lng) && !(s.lat === 0 && s.lng === 0)) pts.push([s.lat, s.lng]);
    });
    if (showRoutes && route && route.length) {
      route.forEach(r => {
        if (Number.isFinite(r.lat) && Number.isFinite(r.lng) && !(r.lat === 0 && r.lng === 0)) pts.push([r.lat, r.lng]);
      });
    }
    return pts;
  }, [drones, stations, route, showRoutes]);

  // Convert route to latlng tuples for Polyline
  const polyline: [number, number][] = useMemo(() => {
    if (!route || !route.length) return [];
    return route.map(r => [r.lat, r.lng]);
  }, [route]);

  return (
    <Paper sx={{ p: 0, height }}>
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ pl: 1 }}>
          Bản đồ Drone
        </Typography>
      </Box>
      <Box sx={{ height: `calc(${height}px - 48px)`, width: '100%' }}>
        <MapContainer
          center={points.length ? (points[0] as [number, number]) : defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Fit bounds when points change */}
          {points.length > 0 && <FitBounds points={points} />}

          {/* Stations as larger circle markers */}
          {stations.map(station => (
            <CircleMarker
              key={`station-${station.id}`}
              center={[station.lat, station.lng]}
              radius={8}
              pathOptions={{ color: '#673ab7', fillColor: '#673ab7', fillOpacity: 0.9 }}
              eventHandlers={{
                click: () => onStationClick && onStationClick(station.id)
              }}
            >
              <Popup>
                <div>
                  <strong>{station.name}</strong>
                  <div>{station.availableDrones}/{station.totalDrones} available</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Drones as circle markers */}
          {drones.map(drone => {
            const lat = Number(drone.currentLat ?? drone.homeLat ?? NaN);
            const lng = Number(drone.currentLng ?? drone.homeLng ?? NaN);
            if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;
            return (
              <CircleMarker
                key={`drone-${drone.id}`}
                center={[lat, lng]}
                radius={selectedDroneId === drone.id ? 9 : 6}
                pathOptions={{ color: statusToColor(drone.status), fillColor: statusToColor(drone.status), fillOpacity: 0.9 }}
                eventHandlers={{
                  click: () => onDroneClick && onDroneClick(drone.id)
                }}
              >
                <Popup>
                  <div>
                    <strong>{drone.id}</strong>
                    <div>Status: {drone.status}</div>
                    <div>Battery: {drone.batteryPct}%</div>
                    {drone.assignedOrderId && <div>Order: {drone.assignedOrderId}</div>}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Route polyline */}
          {showRoutes && polyline.length > 0 && (
            <Polyline positions={polyline} pathOptions={{ color: '#ff5722', weight: 4, opacity: 0.9 }} />
          )}
        </MapContainer>
      </Box>

      {/* Sidebar summary (fallback list) */}
      <Box sx={{ p: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip label={`Drones: ${drones.length}`} size="small" />
          <Chip label={`Stations: ${stations.length}`} size="small" />
          {polyline.length > 0 && <Chip label={`Route points: ${polyline.length}`} size="small" />}
        </Stack>
      </Box>
    </Paper>
  );
};

export default DroneMap;

