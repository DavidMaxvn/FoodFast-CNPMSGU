import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';
import { Box } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import { initTelemetry } from '../services/telemetry';

type LatLng = { lat: number; lng: number };

interface TrackingMapProps {
  height?: number;
  start?: LatLng; // vị trí hiện tại (drone)
  end?: LatLng;   // điểm đến (khách hàng)
  orderId?: string;
  useRealtime?: boolean;
  wsUrl?: string;
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
  orderId,
  useRealtime = true,
  wsUrl,
}) => {
  const startPoint = useMemo<LatLng>(() => start || { lat: 10.8331, lng: 106.6197 }, [start]);
  const endPoint = useMemo<LatLng>(() => end || { lat: 10.8231, lng: 106.6297 }, [end]);
  const route = useMemo(() => buildMockRoute(startPoint, endPoint, 300), [startPoint, endPoint]);

  const [drone, setDrone] = useState<LatLng>(route[0]);

  useEffect(() => {
    // Nếu có realtime, cố gắng kết nối STOMP; nếu thất bại -> fallback nội suy
    if (useRealtime) {
      const stop = initTelemetry((t) => {
        setDrone({ lat: t.lat, lng: t.lng });
      }, {
        wsUrl,
        topic: orderId ? `/topic/drone/${orderId}` : '/topic/drone/demo',
        fallbackStart: startPoint,
        fallbackEnd: endPoint,
        intervalMs: 800,
      });
      return () => stop();
    }
    // Không realtime: tự di chuyển theo tuyến mock
    let i = 0;
    const timer = setInterval(() => {
      i = Math.min(i + 1, route.length - 1);
      setDrone(route[i]);
    }, 500);
    return () => clearInterval(timer);
  }, [useRealtime, wsUrl, orderId, startPoint.lat, startPoint.lng, endPoint.lat, endPoint.lng, route]);

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