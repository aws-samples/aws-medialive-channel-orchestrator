import { useEffect, useState } from "react";
import "@aws-amplify/ui-react/styles.css";
import {
  useAddChannelData,
  useChannel,
  useChannels,
  useRemoveChannelData,
} from "../hooks/useChannels";
import {
  Box,
  CircularProgress,
  Tab,
  Stack,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
} from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import ConfigTable from "../components/ConfigTable";
import ChannelSelector from "../components/ChannelSelector";
import { useForm, Controller } from "react-hook-form";
import DiscoveredOutputsTable from "../components/DiscoveredOutputsTable";

const OUTPUTS = "outputs";
const GRAPHICS = "graphics";

const ConfigForm = ({ onSubmit, onCancel }) => {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      Name: "",
      Url: "https://",
    },
    shouldFocusError: true,
  });
  return (
    <Stack sx={{ width: 650, maxWidth: "100%" }} spacing={2}>
      <Controller
        name="Name"
        control={control}
        rules={{ required: { value: true, message: "Required" } }}
        render={({
          field: { onChange, value },
          fieldState: { invalid, error },
        }) => (
          <TextField
            fullWidth
            variant={"standard"}
            onChange={onChange}
            value={value}
            label={"Name"}
            error={invalid}
            helperText={error?.message}
          />
        )}
      />
      <Controller
        name="Url"
        control={control}
        rules={{ required: { value: true, message: "Required" } }}
        render={({
          field: { onChange, value },
          fieldState: { invalid, error },
        }) => (
          <TextField
            fullWidth
            variant={"standard"}
            onChange={onChange}
            value={value}
            label={"Url"}
            error={invalid}
            helperText={error?.message}
          />
        )}
      />
      <Stack justifyContent={"right"} spacing={2} direction={"row"}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)}>Confirm</Button>
      </Stack>
    </Stack>
  );
};

const Config = () => {
  const { data = { Channels: [] }, isLoading: loadingChannels } = useChannels();
  const channels = data.Channels;
  const [dataType, setDataType] = useState(OUTPUTS);
  const [showForm, setShowForm] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const { data: channelData = {}, isLoading: loadingSelectedChannel } =
    useChannel(selectedChannel?.Id);
  const { removeChannelDataAsync } = useRemoveChannelData(selectedChannel?.Id);
  const { addChannelDataAsync } = useAddChannelData(selectedChannel?.Id);

  useEffect(() => {
    setSelectedChannel((e) =>
      data.Channels.length > 0 && !e ? data.Channels[0] : e
    );
  }, [data]);

  useEffect(() => {
    setSelectedChannel((e) => channels.find((i) => i.Id === e.Id));
  }, [channels]);

  const closeDialog = () => {
    setShowForm(false);
  };

  const handleSubmitConfigForm = (data) =>
    addChannelDataAsync({ dataType: dataType, data })
      .catch(() => console.error("Unable to create item"))
      .finally(closeDialog);

  const onAddDiscovered = ({ Name, Url }) => {
    handleSubmitConfigForm({
      Name,
      Url,
    });
  };

  return (
    <Stack padding={2} spacing={2}>
      <Box sx={{ width: 650, maxWidth: "100%" }}>
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
      {selectedChannel && (
        <>
          <Dialog
            open={showForm}
            onClose={closeDialog}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle
              id="alert-dialog-title"
              sx={{ textTransform: "capitalize" }}
            >
              Add {dataType}
            </DialogTitle>
            <DialogContent>
              <ConfigForm
                onSubmit={handleSubmitConfigForm}
                onCancel={closeDialog}
              />
            </DialogContent>
          </Dialog>
          {loadingSelectedChannel ? (
            <CircularProgress />
          ) : (
            <>
              <TabContext value={dataType}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <TabList
                    onChange={(e, val) => setDataType(val)}
                    aria-label="config tabs"
                  >
                    <Tab label="Outputs" value={OUTPUTS} />
                    <Tab label="Graphics" value={GRAPHICS} />
                  </TabList>
                </Box>
                <TabPanel value={OUTPUTS} sx={{ padding: 0 }}>
                  <ConfigTable
                    data={channelData.Outputs}
                    onDelete={(id) =>
                      removeChannelDataAsync({ id, dataType: OUTPUTS })
                    }
                  />
                </TabPanel>
                <TabPanel value={GRAPHICS} sx={{ padding: 0 }}>
                  {!channelData?.GraphicsEnabled && (
                    <Box mb={1}>
                      <Typography variant={"caption"} color={"error"}>
                        Motion graphics are not enabled for this channel
                      </Typography>
                    </Box>
                  )}
                  <ConfigTable
                    data={channelData.Graphics}
                    onDelete={(id) =>
                      removeChannelDataAsync({ id, dataType: GRAPHICS })
                    }
                  />
                </TabPanel>
              </TabContext>
              <Box align={"center"}>
                <Button onClick={() => setShowForm(true)}>Add New +</Button>
              </Box>
            </>
          )}
        </>
      )}
      {(dataType === OUTPUTS && selectedChannel) && (
        <>
          <Typography variant={"h6"}>Discovered Outputs</Typography>
          <DiscoveredOutputsTable
            existingOutputs={channelData?.Outputs}
            onAdd={onAddDiscovered}
            channelId={selectedChannel?.Id}
          />
        </>
      )}
    </Stack>
  );
};

export default Config;
