import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

const ChannelSelector = ({ channels, selected, onSelect }) => {
  const handleChange = (e) => {
    onSelect(channels.find((i) => i.Id === e.target.value));
  };

  return channels.length > 0 ? (
    <FormControl
      variant="standard"
      sx={{
        textAlign: "left",
        width: "inherit",
        minWidth: 150,
        maxWidth: "100%",
      }}
    >
      <InputLabel id="channel-select-label">Channel Selector</InputLabel>
      <Select
        labelId="channel-select-label"
        id="channel-select"
        value={selected?.Id ?? ""}
        onChange={handleChange}
        label="Age"
      >
        {channels.map((channel) => (
          <MenuItem key={channel.Id} value={channel.Id}>
            {channel.Name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  ) : (
    <Typography>No channels found</Typography>
  );
};

export default ChannelSelector;
