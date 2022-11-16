import { useQuery } from "@tanstack/react-query";
import { CHANNELS_PATH, OUTPUTS_PATH } from "./useChannels";
import useApi from "./useApi";

export const DISCOVER_PATH = "discover";

export const useDiscoverOutputs = (channelId, config = {}) => {
  const { get } = useApi();

  return useQuery(
    [CHANNELS_PATH, OUTPUTS_PATH, DISCOVER_PATH, channelId],
    () =>
      get(`/${CHANNELS_PATH}/${channelId}/${OUTPUTS_PATH}/${DISCOVER_PATH}`)
        .catch((err) => {
          console.error(err);
          throw new Error(`Unable to retrieve channels`);
        })
        .then((res) => res?.Outputs ?? []),
    {
      refetchInterval: 0,
      useErrorBoundary: false,
      enabled: !!channelId,
      ...config,
    }
  );
};

const hooks = {
  useDiscoverOutputs,
};

export default hooks;
