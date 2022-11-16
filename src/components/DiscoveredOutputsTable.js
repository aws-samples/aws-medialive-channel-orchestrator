import {
  Button,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";
import { useDiscoverOutputs } from "../hooks/useDiscoverOutputs";
import usePagination from "../hooks/usePagination";

export const DiscoveredOutputsTable = ({
  existingOutputs = [],
  channelId = [],
  onAdd,
}) => {
  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } =
    usePagination();
  const { data, isLoading, isError } = useDiscoverOutputs(channelId);
  if (isLoading) return <CircularProgress />;
  if (isError)
    return (
      <Typography color={"error"}>Unable to discover any outputs</Typography>
    );
  return (
    <>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((i, idx) => {
                return (
                  <TableRow
                    key={idx}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {i.Type}
                    </TableCell>
                    <TableCell>{i.Name}</TableCell>
                    <TableCell>{i.Url}</TableCell>
                    <TableCell>
                      <Button
                        disabled={existingOutputs.some((j) => i.Url === j.Url)}
                        onClick={() => onAdd(i)}
                        variant={"contained"}
                      >
                        Add
                      </Button>
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

export default DiscoveredOutputsTable;
