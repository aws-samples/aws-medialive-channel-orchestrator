import useApi from "./useApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";

export const CHANNELS_PATH = "channels";
export const GRAPHICS_PATH = "graphics";
export const OUTPUTS_PATH = "outputs";

export const useChannels = (config = {}) => {
  const { get } = useApi();

  return useQuery(
    [CHANNELS_PATH],
    () =>
      get(`/${CHANNELS_PATH}`).catch((err) => {
        console.error(err);
        throw new Error(`Unable to retrieve channels`);
      }),
    {
      refetchInterval: 3000,
      useErrorBoundary: true,
      ...config,
    }
  );
};

export const useChannel = (channelId, config = {}) => {
  const { get } = useApi();

  return useQuery(
    [CHANNELS_PATH, channelId],
    () =>
      get(`/${CHANNELS_PATH}/${channelId}`).catch((err) => {
        console.error(err);
        throw new Error(`Unable to retrieve channel`);
      }),
    {
      refetchInterval: 3000,
      useErrorBoundary: true,
      enabled: !!channelId,
      ...config,
    }
  );
};

export const useUpdateStatus = (channelId, config = {}) => {
  const { put } = useApi();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const mutation = useMutation(
    ({ status }) => put(`/${CHANNELS_PATH}/${channelId}/status/${status}`, {}),
    {
      onSuccess: (_, data) => {
        enqueueSnackbar("Channel update requested", {
          variant: "success",
          autoHideDuration: 3000,
        });
        return queryClient.invalidateQueries([CHANNELS_PATH]);
      },
      onError: (err) => {
        console.error(err);
        enqueueSnackbar("Error updating status", {
          variant: "error",
          autoHideDuration: 3000,
        });
      },
      enabled: !!channelId,
      ...config,
    }
  );
  return {
    updateStatus: mutation.mutate,
    updateStatusAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
  };
};

export const useUpdateInput = (channelId, config = {}) => {
  const { put } = useApi();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const mutation = useMutation(
    ({ input }) =>
      put(`/${CHANNELS_PATH}/${channelId}/activeinput/${input}`, {}),
    {
      onSuccess: (_, data) => {
        enqueueSnackbar("Input switch requested", {
          variant: "success",
          autoHideDuration: 3000,
        });
        return queryClient.invalidateQueries([CHANNELS_PATH]);
      },
      onError: (err) => {
        console.error(err);
        enqueueSnackbar("Error switching inputs", {
          variant: "error",
          autoHideDuration: 3000,
        });
      },
      enabled: !!channelId,
      ...config,
    }
  );
  return {
    updateInput: mutation.mutate,
    updateInputAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
  };
};

export const usePrepareInput = (channelId, config = {}) => {
  const { post } = useApi();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const mutation = useMutation(
    ({ input }) =>
      post(`/${CHANNELS_PATH}/${channelId}/prepareinput/${input}`, {}),
    {
      onSuccess: (_, data) => {
        enqueueSnackbar("Prepare input requested", {
          variant: "success",
          autoHideDuration: 3000,
        });
        return queryClient.invalidateQueries([CHANNELS_PATH]);
      },
      onError: (err) => {
        console.error(err);
        enqueueSnackbar("Error preparing input", {
          variant: "error",
          autoHideDuration: 3000,
        });
      },
      enabled: !!channelId,
      ...config,
    }
  );
  return {
    prepareInput: mutation.mutate,
    prepareInputAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
  };
};

export const useInsertGraphic = (channelId, config = {}) => {
  const { post } = useApi();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const mutation = useMutation(
    ({ graphicId, ...rest }) =>
      post(
        `/${CHANNELS_PATH}/${channelId}/${GRAPHICS_PATH}/${graphicId}/start`,
        rest
      ),
    {
      onSuccess: (_, data) => {
        enqueueSnackbar("Insert graphic requested", {
          variant: "success",
          autoHideDuration: 3000,
        });
        return queryClient.invalidateQueries([CHANNELS_PATH]);
      },
      onError: (err) => {
        console.error(err);
        enqueueSnackbar("Error inserting graphic", {
          variant: "error",
          autoHideDuration: 3000,
        });
      },
      enabled: !!channelId,
      ...config,
    }
  );
  return {
    insertGraphic: mutation.mutate,
    insertGraphicAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
  };
};

export const useAddChannelData = (channelId, config = {}) => {
  const { post } = useApi();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const mutation = useMutation(
    ({ dataType, data }) =>
      post(`/${CHANNELS_PATH}/${channelId}/${dataType}`, data),
    {
      onSuccess: (_, { data, dataType }) => {
        enqueueSnackbar(`Added ${data.Name} to ${dataType}`, {
          variant: "success",
          autoHideDuration: 3000,
        });
        return queryClient.invalidateQueries([CHANNELS_PATH, channelId]);
      },
      onError: (err, { data, dataType }) => {
        console.error(err);
        enqueueSnackbar(`Error adding ${data.Name} to ${dataType}`, {
          variant: "error",
          autoHideDuration: 3000,
        });
      },
      enabled: !!channelId,
      ...config,
    }
  );
  return {
    addChannelData: mutation.mutate,
    addChannelDataAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
  };
};

export const useRemoveChannelData = (channelId, config = {}) => {
  const methods = useApi();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const mutation = useMutation(
    ({ dataType, id }) =>
      methods.delete(`/${CHANNELS_PATH}/${channelId}/${dataType}/${id}`),
    {
      onSuccess: (_, { id, dataType }) => {
        enqueueSnackbar(`Deleted ${dataType.replace(/s+$/, "")}`, {
          variant: "success",
          autoHideDuration: 3000,
        });
        return queryClient.invalidateQueries([CHANNELS_PATH, channelId]);
      },
      onError: (err, { id, dataType }) => {
        console.error(err);
        enqueueSnackbar(`Error deleting ${dataType.replace(/s+$/, "")}`, {
          variant: "error",
          autoHideDuration: 3000,
        });
      },
      enabled: !!channelId,
      ...config,
    }
  );
  return {
    removeChannelData: mutation.mutate,
    removeChannelDataAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
  };
};

export const useStopGraphics = (channelId, config = {}) => {
  const { post } = useApi();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const mutation = useMutation(
    () => post(`/${CHANNELS_PATH}/${channelId}/${GRAPHICS_PATH}/stop`),
    {
      onSuccess: () => {
        enqueueSnackbar(`Stop graphics requested`, {
          variant: "success",
          autoHideDuration: 3000,
        });
        return queryClient.invalidateQueries([CHANNELS_PATH, channelId]);
      },
      onError: (err) => {
        console.error(err);
        enqueueSnackbar(`Error stopping graphics`, {
          variant: "error",
          autoHideDuration: 3000,
        });
      },
      enabled: !!channelId,
      ...config,
    }
  );
  return {
    stopGraphics: mutation.mutate,
    stopGraphicsAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
  };
};

const hooks = {
  useChannels,
  useUpdateStatus,
  usePrepareInput,
  useUpdateInput,
  useInsertGraphic,
  useAddChannelData,
  useRemoveChannelData,
  useStopGraphics,
};

export default hooks;
