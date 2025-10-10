import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';
import { Box } from '@mui/material';
import 'leaflet/dist/leaflet.css';

type LatLng = { lat: number; lng: number };

interface TrackingMapProps {
  height?: number;
  start?: LatLng; // vị trí hiện tại (drone)
  end?: LatLng;   // điểm đến (khách hàng)
}

// Tạo route giả bằng cách nội suy giữa hai điểm
function buildMockRoute(start: LatLng, end: LatLng, steps = 200): LatLng[] {
  const pts: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push({
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t,
    });
  }
  return pts;
}

const TrackingMap: React.FC<TrackingMapProps> = ({
  height = 300,
  start,
  end,
}) => {
  const startPoint = useMemo<LatLng>(() => start || { lat: 10.8331, lng: 106.6197 }, [start]);
  const endPoint = useMemo<LatLng>(() => end || { lat: 10.8231, lng: 106.6297 }, [end]);
  const route = useMemo(() => buildMockRoute(startPoint, endPoint, 300), [startPoint, endPoint]);

  const [index, setIndex] = useState(0);
  const drone = route[Math.min(index, route.length - 1)];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i < route.length - 1 ? i + 1 : i));
    }, 500); // di chuyển mỗi 0.5s
    return () => clearInterval(timer);
  }, [route.length]);

  const center = useMemo<LatLng>(() => ({
    lat: (startPoint.lat + endPoint.lat) / 2,
    lng: (startPoint.lng + endPoint.lng) / 2,
  }), [startPoint, endPoint]);

  return (
    <Box sx={{ position: 'relative', height, width: '100%' }}>
      <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Route giả */}
        <Polyline positions={route} color="#1976d2" weight={4} opacity={0.8} />

        {/* Drone hiện tại */}
        <CircleMarker center={[drone.lat, drone.lng]} radius={8} pathOptions={{ color: '#d32f2f', fillColor: '#d32f2f', fillOpacity: 0.9 }} />

        {/* Điểm đến */}
        <CircleMarker center={[endPoint.lat, endPoint.lng]} radius={10} pathOptions={{ color: '#2e7d32', fillColor: '#2e7d32', fillOpacity: 0.9 }} />
      </MapContainer>
    </Box>
  );
};

export default TrackingMap;