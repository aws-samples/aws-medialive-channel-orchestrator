import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Unstable_Grid2 as Grid,
} from "@mui/material";
import { startableStates, stoppableStates } from "../constants";
import { useUpdateStatus } from "../hooks/useChannels";
import { usePrevious } from "react-use";
import { useState } from "react";

export const ChannelControls = ({ channel }) => {
  const [action, setAction] = useState(null);
  const { updateStatusAsync, isLoading } = useUpdateStatus(channel.Id);
  const prevAction = usePrevious(action);

  const confirmAction = () => {
    updateStatusAsync({
      status: action,
    })
      .catch(console.error)
      .finally(resetAction);
  };

  const resetAction = () => setAction(null);

  return (
    <>
      <Dialog
        open={!!action}
        onClose={resetAction}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle
          id="alert-dialog-title"
          sx={{ textTransform: "capitalize" }}
        >
          Confirm {action ?? prevAction} Channel
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Please confirm you wish to <strong>{action ?? prevAction}</strong>{" "}
            the channel
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={isLoading} onClick={resetAction}>
            Cancel
          </Button>
          <Button disabled={isLoading} onClick={confirmAction} autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <Grid
        container
        paddingX={2}
        paddingY={0}
        spacing={2}
        disableEqualOverflow={true}
        mb={2}
      >
        <Grid xs={12} sm={6} md={4} xl={3}>
          <Button
            sx={{ width: "100%" }}
            onClick={() => setAction("start")}
            variant={"contained"}
            color={"success"}
            disabled={!startableStates.includes(channel?.State)}
          >
            Start Channel
          </Button>
        </Grid>
        <Grid xs={12} sm={6} md={4} xl={3}>
          <Button
            sx={{ width: "100%" }}
            onClick={() => setAction("stop")}
            variant={"contained"}
            color={"error"}
            disabled={!stoppableStates.includes(channel?.State)}
          >
            Stop Channel
          </Button>
        </Grid>
      </Grid>
    </>
  );
};

export default ChannelControls;
