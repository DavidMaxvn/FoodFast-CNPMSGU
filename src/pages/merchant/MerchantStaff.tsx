import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';

/**
 * M09 - Staff Management (Mock)
 * - TODO: Gọi API danh sách nhân viên, thêm/sửa/xóa, phân quyền (sau)
 * - Hiện hiển thị danh sách giả.
 */
interface Staff { id: number; name: string; role: string; phone: string; }

const MOCK_STAFF: Staff[] = [
  { id: 1, name: 'Chef Long', role: 'Bếp trưởng', phone: '0909 000 111' },
  { id: 2, name: 'Phụ bếp Mai', role: 'Phụ bếp', phone: '0909 222 333' },
  { id: 3, name: 'Thu ngân Huy', role: 'Thu ngân', phone: '0909 444 555' },
];

const MerchantStaff: React.FC = () => {
  const [rows, setRows] = useState<Staff[]>([]);

  useEffect(() => {
    // TODO: Gọi API lấy danh sách nhân viên (sau)
    setRows(MOCK_STAFF);
  }, []);

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>Quản lý nhân viên</Typography>
      <Button variant="contained" sx={{ mb: 2 }}>Thêm nhân viên</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Họ tên</TableCell>
            <TableCell>Chức vụ</TableCell>
            <TableCell>SĐT</TableCell>
            <TableCell align="right">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.name}</TableCell>
              <TableCell>{r.role}</TableCell>
              <TableCell>{r.phone}</TableCell>
              <TableCell align="right">
                <Button size="small">Sửa</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default MerchantStaff;