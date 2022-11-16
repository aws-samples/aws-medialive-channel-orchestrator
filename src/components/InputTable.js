import {
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";
import { usePrepareInput, useUpdateInput } from "../hooks/useChannels";
import { useState } from "react";
import { RUNNING_STATE } from "../constants";
import { usePagination } from "../hooks/usePagination";

export const InputTable = ({ channel }) => {
  const inputs = channel.InputAttachments ?? [];
  const { updateInputAsync, isLoading: isUpdatingInput } = useUpdateInput(
    channel.Id
  );
  const { prepareInputAsync, isLoading: isPreparingInput } = usePrepareInput(
    channel.Id
  );
  const [canPrepareInput, setCanPrepareInput] = useState(true);
  const [canUpdateInput, setCanUpdateInput] = useState(true);
  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } =
    usePagination();

  const debounce = (fn, stateSetter, delay) => (val) => {
    stateSetter(false);
    fn(val)
      .then(() => {
        setTimeout(() => {
          stateSetter(true);
        }, delay);
      })
      .catch(() => stateSetter(true));
  };

  const prepare = debounce(prepareInputAsync, setCanPrepareInput, 5000);
  const update = debounce(updateInputAsync, setCanUpdateInput, 5000);

  return (
    <>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="center">Attached to Pipeline</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inputs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>No inputs found</TableCell>
              </TableRow>
            )}
            {inputs
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((input) => {
                const isActive = input.Active;
                return (
                  <TableRow
                    key={input.Name}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {input.Name}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        color={isActive ? "success" : "error"}
                        label={isActive ? "YES" : "NO"}
                      />
                    </TableCell>
                    <TableCell>
                      {!isActive && (
                        <Stack
                          spacing={1}
                          alignItems={"right"}
                          direction={"row"}
                        >
                          <Button
                            disabled={
                              isPreparingInput ||
                              !canPrepareInput ||
                              channel?.State !== RUNNING_STATE
                            }
                            onClick={() => prepare({ input: input.Name })}
                            variant={"outlined"}
                          >
                            Prepare
                          </Button>
                          <Button
                            disabled={
                              isUpdatingInput ||
                              !canUpdateInput ||
                              channel?.State !== RUNNING_STATE
                            }
                            onClick={() => update({ input: input.Name })}
                            variant={"contained"}
                          >
                            Switch
                          </Button>
                        </Stack>
                      )}
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
        count={inputs.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  );
};

export default InputTable;
