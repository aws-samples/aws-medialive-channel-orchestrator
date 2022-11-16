import { ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";

const OutputSelector = ({ outputs = [], selected, onSelect }) => {
  const handleChange = (e) => {
    onSelect(outputs.find((i) => i.Id === e.target.value));
  };

  return outputs.length > 0 ? (
    <ToggleButtonGroup
      color="primary"
      value={selected?.Id}
      exclusive
      onChange={handleChange}
      aria-label="Endpoint"
      size={"small"}
    >
      {outputs.map((i) => (
        <ToggleButton key={i.Id} value={i.Id}>
          {i.Name}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  ) : (
    <Typography>No outputs found</Typography>
  );
};

export default OutputSelector;
