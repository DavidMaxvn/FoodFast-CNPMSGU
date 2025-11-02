import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Switch,
  FormControlLabel,
  LinearProgress,
  Divider,
  Snackbar
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Flight,
  FlightTakeoff,
  FlightLand,
  BatteryFull,
  Battery80,
  Battery50,
  Battery20,
  Warning,
  CheckCircle,
  Refresh,
  LocationOn,
  Settings,
  Assignment,
  Stop,
  PlayArrow,
  Home,
  Build,
  PowerSettingsNew
} from '@mui/icons-material';
import DroneMap from '../../components/DroneMap';
import DroneAssignmentService, { DroneStation, AssignmentRequest } from '../../services/droneAssignmentService';
import DroneManagementService, { DroneFleet as DroneFleetType } from '../../services/droneManagementService';

interface DroneFleet {
  id: string;
  serialNumber: string;
  model: string;
  status: 'IDLE' | 'ASSIGNED' | 'DELIVERING' | 'RETURNING' | 'CHARGING' | 'MAINTENANCE' | 'OFFLINE';
  batteryLevel: number;
  currentLat: number;
  currentLng: number;
  homeLat: number;
  homeLng: number;
  stationId?: string;
  assignedOrderId?: string;
  deliveryId?: string;
  lastMaintenance?: string;
  totalFlights?: number;
  flightHours?: number;
  maxPayload: number;
  maxRange: number;
  isActive: boolean;
  lastAssignedAt?: string;
}

const DroneManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [drones, setDrones] = useState<DroneFleet[]>([]);
  const [stations, setStations] = useState<DroneStation[]>([]);
  const [selectedDrone, setSelectedDrone] = useState<DroneFleet | null>(null);
  const [selectedStation, setSelectedStation] = useState<DroneStation | null>(null);
  const [openDroneDialog, setOpenDroneDialog] = useState(false);
  const [openStationDialog, setOpenStationDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [droneStations, setDroneStations] = useState<DroneStation[]>([]);
  const [assignmentRequest, setAssignmentRequest] = useState<AssignmentRequest | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'success' | 'error' | 'info' | 'warning' });

  // Load drone data from API
  useEffect(() => {
    loadDroneData();
    loadDroneStations();
  }, []);

  const loadDroneStations = async () => {
    try {
      const stations = await DroneAssignmentService.getDroneStations();
      setDroneStations(stations);
    } catch (error) {
      console.error('Error loading drone stations:', error);
      setSnackbar({ open: true, message: 'Lỗi khi tải dữ liệu trạm drone', severity: 'error' });
    }
  };

  const handleAutoAssignment = async () => {
    if (!assignmentRequest) return;

    try {
      setLoading(true);
      const result = await DroneAssignmentService.autoAssignDroneWithStation(assignmentRequest);
      
      if (result.success) {
        setSnackbar({ 
          open: true, 
          message: `Thành công: ${result.message}. Thời gian giao hàng ước tính: ${result.estimatedDeliveryTime} phút`, 
          severity: 'success' 
        });
        setAssignmentDialogOpen(false);
        // Refresh data
        loadDroneStations();
      } else {
        setSnackbar({ open: true, message: result.message, severity: 'error' });
      }
    } catch (error) {
      console.error('Auto assignment error:', error);
      setSnackbar({ open: true, message: 'Lỗi khi gán drone tự động', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openAssignmentDialog = () => {
    // Mock assignment request - trong thực tế sẽ có form để nhập
    setAssignmentRequest({
      orderId: 'order-123',
      customerLocation: { lat: 10.762622, lng: 106.660172 },
      storeLocation: { lat: 10.786785, lng: 106.695053 },
      priority: 'normal',
      estimatedWeight: 500
    });
    setAssignmentDialogOpen(true);
  };

  const loadDroneData = async () => {
    try {
      setLoading(true);
      
      // Load real drone data from API
      const dronesData = await DroneManagementService.getAllDrones();
      console.log('Loaded drones:', dronesData);
      setDrones(dronesData);

      // Load drone stations
      const stationsData = await DroneAssignmentService.getDroneStations();
      setStations(stationsData);

      setError(null);
    } catch (err) {
      console.error('Error loading drone data:', err);
      setError('Không thể tải dữ liệu drone từ API. Đang sử dụng dữ liệu mẫu.');
      
      // Fallback to mock data if API fails
      const mockDrones: DroneFleet[] = [
        {
          id: 'drone-001',
          serialNumber: 'DRN-001-2024',
          model: 'FastFood Delivery Pro X1',
          status: 'IDLE',
          batteryLevel: 95,
          currentLat: 10.762622,
          currentLng: 106.660172,
          homeLat: 10.762622,
          homeLng: 106.660172,
          stationId: 'station-1',
          lastMaintenance: '2024-01-15',
          totalFlights: 245,
          flightHours: 120.5,
          maxPayload: 5,
          maxRange: 15,
          isActive: true
        },
        {
          id: 'drone-002',
          serialNumber: 'DRN-002-2024',
          model: 'FastFood Delivery Pro X1',
          status: 'DELIVERING',
          batteryLevel: 78,
          currentLat: 10.775622,
          currentLng: 106.670172,
          homeLat: 10.762622,
          homeLng: 106.660172,
          stationId: 'station-1',
          assignedOrderId: 'ORD-12345',
          lastMaintenance: '2024-01-10',
          totalFlights: 189,
          flightHours: 95.2,
          maxPayload: 5,
          maxRange: 15,
          isActive: true
        },
        {
          id: 'drone-003',
          serialNumber: 'DRN-003-2024',
          model: 'FastFood Delivery Lite',
          status: 'CHARGING',
          batteryLevel: 45,
          currentLat: 10.786785,
          currentLng: 106.700806,
          homeLat: 10.786785,
          homeLng: 106.700806,
          stationId: 'station-2',
          lastMaintenance: '2024-01-20',
          totalFlights: 156,
          flightHours: 78.3,
          maxPayload: 3,
          maxRange: 10,
          isActive: true
        }
      ];

      const mockStations: DroneStation[] = [
        {
          id: 'station-1',
          name: 'Trạm Drone Quận 1',
          location: {
            lat: 10.762622,
            lng: 106.660172
          },
          capacity: 5,
          currentDrones: 2,
          availableDrones: ['drone-001', 'drone-003'],
          coverageRadius: 5,
          status: 'active'
        },
        {
          id: 'station-2',
          name: 'Trạm Drone Quận 3',
          location: {
            lat: 10.786785,
            lng: 106.700806
          },
          capacity: 4,
          currentDrones: 2,
          availableDrones: ['drone-004', 'drone-005'],
          coverageRadius: 4,
          status: 'active'
        }
      ];

      setDrones(mockDrones);
      setStations(mockStations);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: 'success' | 'warning' | 'error' | 'info' | 'default' } = {
      'IDLE': 'success',
      'EN_ROUTE_TO_STORE': 'info',
      'AT_STORE': 'warning',
      'EN_ROUTE_TO_CUSTOMER': 'info',
      'DELIVERING': 'warning',
      'RETURNING': 'info',
      'CHARGING': 'warning',
      'MAINTENANCE': 'error',
      'OFFLINE': 'default'
    };
    return colors[status] || 'default';
  };

  const getBatteryIcon = (level: number) => {
    if (level > 80) return <BatteryFull color="success" />;
    if (level > 60) return <Battery80 color="success" />;
    if (level > 40) return <Battery50 color="warning" />;
    return <Battery20 color="error" />;
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: React.ReactElement } = {
      'IDLE': <CheckCircle color="success" />,
      'EN_ROUTE_TO_STORE': <FlightTakeoff color="info" />,
      'AT_STORE': <LocationOn color="warning" />,
      'EN_ROUTE_TO_CUSTOMER': <Flight color="info" />,
      'DELIVERING': <Assignment color="warning" />,
      'RETURNING': <FlightLand color="info" />,
      'CHARGING': <PowerSettingsNew color="warning" />,
      'MAINTENANCE': <Build color="error" />,
      'OFFLINE': <Warning color="disabled" />
    };
    return icons[status] || <Warning />;
  };

  const handleDroneAction = async (droneId: string, action: string) => {
    try {
      setLoading(true);
      
      switch (action) {
        case 'maintenance':
          await DroneManagementService.setDroneMaintenance(droneId);
          setSnackbar({
            open: true,
            message: 'Drone đã được đưa vào bảo trì',
            severity: 'success'
          });
          break;
          
        case 'activate':
          await DroneManagementService.activateDrone(droneId);
          setSnackbar({
            open: true,
            message: 'Drone đã được kích hoạt',
            severity: 'success'
          });
          break;
          
        case 'stop':
          const drone = drones.find(d => d.id === droneId);
          if (drone?.deliveryId) {
            await DroneManagementService.stopDelivery(drone.deliveryId);
            setSnackbar({
              open: true,
              message: 'Đã dừng delivery',
              severity: 'warning'
            });
          }
          break;
          
        case 'start':
          // This would typically trigger assignment dialog
          console.log(`Starting drone ${droneId}`);
          break;
          
        case 'return':
          await DroneManagementService.updateDroneStatus(droneId, 'RETURNING');
          setSnackbar({
            open: true,
            message: 'Drone đang trở về trạm',
            severity: 'info'
          });
          break;
          
        default:
          console.log(`Unknown action: ${action} for drone ${droneId}`);
      }
      
      // Reload data after action
      await loadDroneData();
      
    } catch (error) {
      console.error('Error performing drone action:', error);
      setSnackbar({
        open: true,
        message: 'Có lỗi xảy ra khi thực hiện hành động',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStationAction = (stationId: string, action: string) => {
    console.log(`Station ${stationId} action: ${action}`);
    // Implement station actions
  };

  const DroneFleetTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Quản Lý Fleet Drone ({drones.length} drones)
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDroneDialog(true)}
        >
          Thêm Drone
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Fleet Overview Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {drones.filter(d => d.status === 'IDLE').length}
                </Typography>
              </Box>
              <Typography color="text.secondary">Sẵn Sàng</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Flight color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {drones.filter(d => d.status.includes('EN_ROUTE') || d.status === 'DELIVERING').length}
                </Typography>
              </Box>
              <Typography color="text.secondary">Đang Bay</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PowerSettingsNew color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {drones.filter(d => d.status === 'CHARGING').length}
                </Typography>
              </Box>
              <Typography color="text.secondary">Đang Sạc</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Build color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {drones.filter(d => d.status === 'MAINTENANCE' || d.status === 'OFFLINE').length}
                </Typography>
              </Box>
              <Typography color="text.secondary">Bảo Trì</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Drone Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Drone</TableCell>
                  <TableCell>Trạng Thái</TableCell>
                  <TableCell>Pin</TableCell>
                  <TableCell>Vị Trí</TableCell>
                  <TableCell>Trạm</TableCell>
                  <TableCell>Đơn Hàng</TableCell>
                  <TableCell>Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drones.map((drone) => (
                  <TableRow key={drone.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{drone.serialNumber}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {drone.model}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getStatusIcon(drone.status)}
                        <Chip
                          label={drone.status}
                          color={getStatusColor(drone.status)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getBatteryIcon(drone.batteryLevel)}
                        <Typography sx={{ ml: 1 }}>{drone.batteryLevel}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {drone.currentLat.toFixed(4)}, {drone.currentLng.toFixed(4)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {stations.find(s => s.id === drone.stationId)?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {drone.assignedOrderId ? (
                        <Chip label={drone.assignedOrderId} size="small" color="primary" />
                      ) : (
                        <Typography color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Chi tiết">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedDrone(drone)}
                          >
                            <Settings />
                          </IconButton>
                        </Tooltip>
                        {drone.status === 'IDLE' && (
                          <Tooltip title="Bắt đầu">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleDroneAction(drone.id, 'start')}
                            >
                              <PlayArrow />
                            </IconButton>
                          </Tooltip>
                        )}
                        {(drone.status.includes('EN_ROUTE') || drone.status === 'DELIVERING') && (
                          <Tooltip title="Dừng">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDroneAction(drone.id, 'stop')}
                            >
                              <Stop />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Về trạm">
                          <IconButton
                            size="small"
                            onClick={() => handleDroneAction(drone.id, 'return')}
                          >
                            <Home />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );

  const StationManagementTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Quản Lý Trạm Drone ({stations.length} trạm)
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenStationDialog(true)}
        >
          Thêm Trạm
        </Button>
      </Box>

      <Grid container spacing={3}>
        {stations.map((station) => (
          <Grid item xs={12} md={6} key={station.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6">{station.name}</Typography>
                  <Chip
                    label={station.status}
                    color={station.status === 'active' ? 'success' : 'error'}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Lat: {station.location.lat}, Lng: {station.location.lng}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h4" color="primary">
                      {station.availableDrones.length}
                    </Typography>
                    <Typography variant="caption">Sẵn sàng</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h4">
                      {station.capacity}
                    </Typography>
                    <Typography variant="caption">Tổng số</Typography>
                  </Box>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={(station.availableDrones.length / station.capacity) * 100}
                  sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<Settings />}
                    onClick={() => setSelectedStation(station)}
                  >
                    Cài đặt
                  </Button>
                  <Button
                    size="small"
                    startIcon={<LocationOn />}
                    onClick={() => handleStationAction(station.id, 'view_map')}
                  >
                    Xem bản đồ
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const MapOverviewTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Tổng Quan Bản Đồ Fleet
      </Typography>
      <Paper sx={{ p: 2 }}>
        <DroneMap
          drones={drones.map(drone => ({
            id: drone.id,
            status: drone.status,
            currentLat: drone.currentLat,
            currentLng: drone.currentLng,
            batteryPct: drone.batteryLevel,
            assignedOrderId: drone.assignedOrderId
          }))}
          stations={stations.map(station => ({
            id: station.id,
            name: station.name,
            lat: station.location.lat,
            lng: station.location.lng,
            availableDrones: station.availableDrones.length,
            totalDrones: station.capacity,
            status: station.status === 'active' ? 'ACTIVE' : station.status === 'maintenance' ? 'MAINTENANCE' : 'OFFLINE'
          }))}
          height={600}
          showRoutes={false}
          onDroneClick={(droneId: string) => {
            const drone = drones.find(d => d.id === droneId);
            if (drone) setSelectedDrone(drone);
          }}
          onStationClick={(stationId: string) => {
            const station = stations.find(s => s.id === stationId);
            if (station) setSelectedStation(station);
          }}
        />
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quản Lý Drone Fleet
        </Typography>
        <Box>
          {/* Ẩn button Gán Drone Tự Động cho demo */}
          {/* <Button
            variant="contained"
            startIcon={<Assignment />}
            onClick={openAssignmentDialog}
            sx={{ mr: 2 }}
            color="primary"
          >
            Gán Drone Tự Động
          </Button> */}
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDroneData}
            sx={{ mr: 2 }}
            disabled={loading}
          >
            {loading ? 'Đang tải...' : 'Làm mới'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Settings />}
            onClick={() => setConfigDialogOpen(true)}
          >
            Cấu hình
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Fleet Drone" />
          <Tab label="Trạm Drone" />
          <Tab label="Bản Đồ Tổng Quan" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && <DroneFleetTab />}
          {tabValue === 1 && <StationManagementTab />}
          {tabValue === 2 && <MapOverviewTab />}
        </Box>
      </Paper>

      {/* Drone Detail Dialog */}
      <Dialog
        open={!!selectedDrone}
        onClose={() => setSelectedDrone(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedDrone && (
          <>
            <DialogTitle>
              Chi Tiết Drone: {selectedDrone.serialNumber}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Thông Tin Cơ Bản</Typography>
                  <Typography>Model: {selectedDrone.model}</Typography>
                  <Typography>Trạng thái: {selectedDrone.status}</Typography>
                  <Typography>Pin: {selectedDrone.batteryLevel}%</Typography>
                  <Typography>Tải trọng tối đa: {selectedDrone.maxPayload}kg</Typography>
                  <Typography>Tầm bay: {selectedDrone.maxRange}km</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Thống Kê</Typography>
                  <Typography>Tổng chuyến bay: {selectedDrone.totalFlights}</Typography>
                  <Typography>Giờ bay: {selectedDrone.flightHours}h</Typography>
                  <Typography>Bảo trì cuối: {selectedDrone.lastMaintenance}</Typography>
                  <Typography>Vị trí: {selectedDrone.currentLat.toFixed(4)}, {selectedDrone.currentLng.toFixed(4)}</Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedDrone(null)}>Đóng</Button>
              <Button variant="contained">Cập Nhật</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Station Detail Dialog */}
      <Dialog
        open={!!selectedStation}
        onClose={() => setSelectedStation(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedStation && (
          <>
            <DialogTitle>
              Chi Tiết Trạm: {selectedStation.name}
            </DialogTitle>
            <DialogContent>
              <Typography>Tọa độ: {selectedStation.location.lat}, {selectedStation.location.lng}</Typography>
              <Typography>Tổng drone: {selectedStation.capacity}</Typography>
              <Typography>Drone sẵn sàng: {selectedStation.availableDrones.length}</Typography>
              <Typography>Trạng thái: {selectedStation.status}</Typography>
              <Typography>Bán kính phủ sóng: {selectedStation.coverageRadius} km</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedStation(null)}>Đóng</Button>
              <Button variant="contained">Cập Nhật</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

        {/* Auto Assignment Dialog */}
        <Dialog open={assignmentDialogOpen} onClose={() => setAssignmentDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Gán Drone Tự Động</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Thông tin đơn hàng
              </Typography>
              {assignmentRequest && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Mã đơn hàng"
                      value={assignmentRequest.orderId}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Trọng lượng (g)"
                      value={assignmentRequest.estimatedWeight}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Vị trí cửa hàng"
                      value={`${assignmentRequest.storeLocation.lat}, ${assignmentRequest.storeLocation.lng}`}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Vị trí khách hàng"
                      value={`${assignmentRequest.customerLocation.lat}, ${assignmentRequest.customerLocation.lng}`}
                      disabled
                    />
                  </Grid>
                </Grid>
              )}
              
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Trạm drone khả dụng
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tên trạm</TableCell>
                      <TableCell>Vị trí</TableCell>
                      <TableCell>Drone khả dụng</TableCell>
                      <TableCell>Bán kính (km)</TableCell>
                      <TableCell>Trạng thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {droneStations.map((station) => (
                      <TableRow key={station.id}>
                        <TableCell>{station.name}</TableCell>
                        <TableCell>{`${station.location.lat.toFixed(4)}, ${station.location.lng.toFixed(4)}`}</TableCell>
                        <TableCell>{station.availableDrones.length}/{station.capacity}</TableCell>
                        <TableCell>{station.coverageRadius}</TableCell>
                        <TableCell>
                          <Chip 
                            label={station.status} 
                            color={station.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignmentDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleAutoAssignment} 
              variant="contained"
              disabled={loading}
              startIcon={<CheckCircle />}
            >
              {loading ? 'Đang xử lý...' : 'Gán Drone'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  };
  
  export default DroneManagement;