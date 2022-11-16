import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TablePagination,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { usePagination } from "../hooks/usePagination";

const ConfigTable = ({ data = [], onDelete }) => {
  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } =
    usePagination();

  return (
    <>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Url</TableCell>
              <TableCell>Actions</TableCell>
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
                return (
                  <TableRow
                    key={i.Id}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell>{i.Name}</TableCell>
                    <TableCell>{i.Url}</TableCell>
                    <TableCell>
                      <IconButton
                        to={"/"}
                        size="small"
                        aria-label="home page"
                        color="inherit"
                        onClick={() => onDelete(i.Id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
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

export default ConfigTable;
