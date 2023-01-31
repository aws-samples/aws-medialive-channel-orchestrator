import { useEffect, useState } from "react";
import "@aws-amplify/ui-react/styles.css";
import { useChannels, useChannel, useStopGraphics } from "../hooks/useChannels";
import {
  Box,
  CircularProgress,
  Stack,
  Typography,
  Unstable_Grid2 as Grid,
  Button,
} from "@mui/material";
import ReactPlayer from "react-player";
import ChannelSelector from "../components/ChannelSelector";
import OutputSelector from "../components/OutputSelector";
import InputTable from "../components/InputTable";
import ChannelStatus from "../components/ChannelStatus";
import ChannelControls from "../components/ChannelControls";
import GraphicForm from "../components/GraphicForm";
import { RUNNING_STATE } from "../constants";
import AlertsTable from "../components/AlertsTable";

const StatusNote = ({ type }) => (
  <Typography variant={"caption"}>
    {type} controls are unavailable whilst a channel is not running
  </Typography>
);

const Home = () => {
  const { data = { Channels: [] }, isLoading: loadingChannels } = useChannels();
  const channels = data.Channels;
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedOutput, setSelectedOutput] = useState(null);
  const { data: channelData = {}, isLoading: loadingSelectedChannel } =
    useChannel(selectedChannel?.Id);
  const outputs = channelData?.Outputs ?? [];
  const graphics = channelData?.Graphics ?? [];
  const { stopGraphicsAsync, isLoading: stoppingGraphics } = useStopGraphics(
    selectedChannel?.Id
  );

  useEffect(() => {
    setSelectedChannel((e) =>
      data.Channels.length > 0 && !e ? data.Channels[0] : e
    );
  }, [data]);

  useEffect(() => {
    if (selectedChannel && channelData) {
      setSelectedOutput((e) => {
        if (channelData.Outputs?.map((i) => i.Url).includes(e?.Url)) return e;
        return channelData.Outputs?.length ? channelData.Outputs[0] : null;
      });
    }
  }, [data, channelData, selectedChannel]);

  useEffect(() => {
    setSelectedChannel((e) => channels.find((i) => i.Id === e.Id));
  }, [channels]);

  return (
    <>
      <Grid container p={2} spacing={2} disableEqualOverflow={true}>
        <Grid xs={12} lg={5}>
          <Stack spacing={2}>
            <Box sx={{ width: "100%" }}>
              {loadingChannels ? (
                <CircularProgress />
              ) : (
                <ChannelSelector
                  selected={selectedChannel}
                  channels={channels}
                  onSelect={setSelectedChannel}
                />
              )}
            </Box>
            {!loadingChannels && selectedChannel && (
              <>
                {outputs.length > 0 ? (
                  <>
                    <Box
                      sx={{
                        position: "relative",
                        paddingTop: "56.25%",
                        marginY: 2,
                        marginX: "auto",
                      }}
                    >
                      <ReactPlayer
                        width="100%"
                        height="100%"
                        url={selectedOutput?.Url}
                        controls
                        style={{
                          position: "absolute",
                          zIndex: 1,
                          top: 0,
                          left: 0,
                          background: "#fafafa",
                        }}
                        playing={true}
                        playsinline={true}
                        muted={true}
                      />
                    </Box>
                    <OutputSelector
                      outputs={outputs}
                      selected={selectedOutput}
                      onSelect={setSelectedOutput}
                    />
                  </>
                ) : (
                  <Typography>No outputs available to display</Typography>
                )}
              </>
            )}
          </Stack>
        </Grid>
        <Grid xs={12} lg={7}>
          {selectedChannel && (
            <>
              {!loadingSelectedChannel ? (
                <Stack spacing={2}>
                  <Typography variant={"h6"}>Channel Controls</Typography>
                  <Box>
                    <ChannelControls channel={selectedChannel} />
                    <ChannelStatus state={selectedChannel.State} />
                  </Box>

                  <Box>
                    <Typography variant={"h6"}>Inputs</Typography>
                    {selectedChannel.State !== RUNNING_STATE && (
                      <StatusNote type={"Input"} />
                    )}
                  </Box>
                  <InputTable channel={selectedChannel} />

                  <Box>
                    <Typography variant={"h6"}>Graphics</Typography>
                    {selectedChannel.State !== RUNNING_STATE && (
                      <StatusNote type={"Graphics"} />
                    )}
                  </Box>
                  {!channelData.GraphicsEnabled ? (
                    <Typography color={"warning"}>
                      Motion graphics not enabled for this channel
                    </Typography>
                  ) : (
                    <>
                      <GraphicForm
                        graphics={graphics}
                        channel={selectedChannel}
                      />
                      <Box>
                        <Button
                          disabled={
                            stoppingGraphics ||
                            selectedChannel.State !== RUNNING_STATE
                          }
                          variant={"outlined"}
                          color={"error"}
                          onClick={stopGraphicsAsync}
                        >
                          Stop Graphics
                        </Button>
                      </Box>
                    </>
                  )}

                  <Box>
                    <Typography variant={"h6"}>Alerts</Typography>
                    <AlertsTable data={channelData?.Alerts} />
                  </Box>
                </Stack>
              ) : (
                <CircularProgress />
              )}
            </>
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default Home;
