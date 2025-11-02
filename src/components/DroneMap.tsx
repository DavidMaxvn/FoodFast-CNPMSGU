import React from 'react';
import { Box, Paper, Typography, Chip, Stack } from '@mui/material';

type DroneItem = {
  id: string;
  status: string;
  currentLat: number;
  currentLng: number;
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

interface DroneMapProps {
  drones: DroneItem[];
  stations: StationItem[];
  height?: number;
  showRoutes?: boolean;
  onDroneClick?: (droneId: string) => void;
  onStationClick?: (stationId: string) => void;
}

// Placeholder map component to unblock compilation for demo
const DroneMap: React.FC<DroneMapProps> = ({
  drones,
  stations,
  height = 400,
  showRoutes = false,
  onDroneClick,
  onStationClick,
}) => {
  return (
    <Paper sx={{ p: 2, height }}>
      <Typography variant="subtitle1" gutterBottom>
        Bản đồ (placeholder) — {showRoutes ? 'Hiển thị tuyến' : 'Ẩn tuyến'}
      </Typography>
      <Box sx={{ display: 'flex', gap: 4 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2">Drones</Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {drones.map((d) => (
              <Box
                key={d.id}
                onClick={() => onDroneClick && onDroneClick(d.id)}
                sx={{
                  border: '1px solid #eee',
                  borderRadius: 1,
                  p: 1,
                  cursor: onDroneClick ? 'pointer' : 'default',
                }}
              >
                <Typography variant="body2">
                  {d.id} — {d.status}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({d.currentLat.toFixed(4)}, {d.currentLng.toFixed(4)}) — Pin {d.batteryPct}%
                </Typography>
                {d.assignedOrderId && (
                  <Chip label={`ĐH: ${d.assignedOrderId}`} size="small" sx={{ ml: 1 }} />
                )}
              </Box>
            ))}
          </Stack>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2">Trạm</Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {stations.map((s) => (
              <Box
                key={s.id}
                onClick={() => onStationClick && onStationClick(s.id)}
                sx={{
                  border: '1px solid #eee',
                  borderRadius: 1,
                  p: 1,
                  cursor: onStationClick ? 'pointer' : 'default',
                }}
              >
                <Typography variant="body2">
                  {s.name} — {s.status}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({s.lat.toFixed(4)}, {s.lng.toFixed(4)}) — {s.availableDrones}/{s.totalDrones} sẵn sàng
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
};

export default DroneMap;