import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Input,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useInsertGraphic } from "../hooks/useChannels";
import { RUNNING_STATE } from "../constants";

function isNumeric(str) {
  if (typeof str !== "string") return false;
  return !isNaN(str) && !isNaN(parseInt(str)) && isFinite(parseInt(str));
}

const GraphicForm = ({ graphics = [], channel }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [enableDuration, setEnableDuration] = useState(false);
  const [duration, setDuration] = useState("");
  const [selectedGraphic, setSelectedGraphic] = useState(null);
  const { insertGraphicAsync } = useInsertGraphic(channel.Id);

  useEffect(() => {
    setSelectedGraphic((e) => {
      if (!e) return graphics[0];
      return graphics.find((i) => i.Id === e.Id) ? e : graphics[0];
    });
  }, [graphics]);

  const closeDialog = () => {
    setShowDialog(false);
    setDuration("");
    setEnableDuration(false);
  };

  const handleDurationToggle = (e) => {
    setEnableDuration(!e.target.checked);
  };

  const handleDurationChange = (e) => {
    setDuration(e.target.value);
  };

  const confirmAction = () => {
    const input = {
      graphicId: selectedGraphic.Id,
    };
    if (enableDuration) input.Duration = parseInt(duration) * 1000;
    insertGraphicAsync(input).catch(console.error).finally(closeDialog);
  };

  const handleChange = (e) => {
    setSelectedGraphic(graphics.find((i) => i.Id === e.target.value));
  };

  return graphics.length > 0 ? (
    <>
      <Dialog
        open={showDialog}
        onClose={closeDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle
          id="alert-dialog-title"
          sx={{ textTransform: "capitalize" }}
        >
          Confirm Insert Graphic
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Please confirm how long to display the graphic{" "}
            <strong>{selectedGraphic?.Name}</strong> on the channel
          </DialogContentText>
          <Stack spacing={1} pt={1}>
            <FormControlLabel
              control={
                <Switch
                  onChange={handleDurationToggle}
                  checked={!enableDuration}
                />
              }
              label="Show indefinitely"
            />
            {enableDuration && (
              <FormControl variant="standard">
                <Input
                  value={duration}
                  onChange={handleDurationChange}
                  variant={"standard"}
                  endAdornment={
                    <InputAdornment position="end">seconds</InputAdornment>
                  }
                  inputProps={{
                    "aria-label": "seconds",
                  }}
                />
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            disabled={enableDuration && !isNumeric(duration)}
            onClick={confirmAction}
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <Box component={"form"} sx={{ display: "flex", alignItems: "baseline" }}>
        <FormControl
          variant="standard"
          sx={{ textAlign: "left", flexGrow: 1, marginRight: 2 }}
        >
          <InputLabel id="channel-select-label">Graphic Selector</InputLabel>
          <Select
            labelId="graphic-select-label"
            id="graphic-select"
            value={selectedGraphic?.Id ?? ""}
            label="Graphic"
            onChange={handleChange}
            margin={"dense"}
            size={"small"}
          >
            {graphics.map((i) => (
              <MenuItem key={i.Id} value={i.Id}>
                {i.Name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box>
          <Button
            disabled={!selectedGraphic || channel.State !== RUNNING_STATE}
            sx={{ width: 120 }}
            variant={"contained"}
            onClick={() => setShowDialog(true)}
          >
            Insert
          </Button>
        </Box>
      </Box>
    </>
  ) : (
    <Typography>No graphics available</Typography>
  );
};

export default GraphicForm;
