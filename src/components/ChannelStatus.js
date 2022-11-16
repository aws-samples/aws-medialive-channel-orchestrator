import { Box, Stack, Typography, useTheme } from "@mui/material";

const stateColourMap = {
  IDLE: "error",
  RUNNING: "success",
  STARTING: "warning",
  STOPPING: "warning",
};

export const ChannelStatus = ({ state }) => {
  const theme = useTheme();
  return (
    <Stack direction={"row"} spacing={1} alignItems={"center"}>
      <Typography>STATE:</Typography>
      <Box
        sx={{
          width: 30,
          height: 30,
          backgroundColor:
            theme.palette[stateColourMap[state] ?? "warning"].main,
          borderRadius: "100%",
        }}
      />
      <Typography>{state}</Typography>
    </Stack>
  );
};

export default ChannelStatus;
