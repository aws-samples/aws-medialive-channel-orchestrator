import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";
import { usePagination } from "../hooks/usePagination";

const AlertsTable = ({ data = [] }) => {
  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } =
    usePagination();

  return (
    <>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>State Updated At</TableCell>
              <TableCell>State</TableCell>
              <TableCell>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>No records found</TableCell>
              </TableRow>
            )}
            {data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((i) => {
                const date = new Date(0);
                date.setSeconds(i.AlertedAt);
                const timeString = date.toISOString();
                return (
                  <TableRow
                    key={i.Id}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell>{timeString}</TableCell>
                    <TableCell>{i.State}</TableCell>
                    <TableCell>{i.Message}</TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 20]}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  );
};

export default AlertsTable;
