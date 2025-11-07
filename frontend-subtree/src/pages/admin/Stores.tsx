import React from 'react';
import { Box, Typography, Card, CardContent, TextField, InputAdornment, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Stack, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';

const mockStores = [
  { id: 'st-001', name: 'Fastfood Nguyễn Trãi', status: 'ACTIVE', manager: 'Nguyễn Văn A' },
  { id: 'st-002', name: 'Fastfood Quang Trung', status: 'PENDING', manager: 'Trần Thị B' },
  { id: 'st-003', name: 'Fastfood Tôn Đức Thắng', status: 'SUSPENDED', manager: 'Phạm Văn C' },
];

const Stores: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Stores Management
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Quản lý danh sách cửa hàng trên toàn hệ thống.
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Tìm kiếm theo tên, ID, người quản lý..."
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Tên cửa hàng</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Quản lý</TableCell>
                <TableCell align="right">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockStores.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>{s.id}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.status}</TableCell>
                  <TableCell>{s.manager}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton color="primary" onClick={() => navigate(`/admin/stores/${s.id}`)}>
                        <VisibilityIcon />
                      </IconButton>
                      <Button size="small" variant="outlined">Suspend</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Stores;