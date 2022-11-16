import { API } from "aws-amplify";

export const useApi = (apiName = "data") => {
  return {
    get: (path, clientConfig = {}) => API.get(apiName, path, clientConfig),
    post: (path, data, clientConfig = {}) =>
      API.post(apiName, path, {
        body: data,
        ...clientConfig,
      }),
    put: (path, data, clientConfig = {}) =>
      API.put(apiName, path, data, {
        body: data,
        ...clientConfig,
      }),
    delete: (path, clientConfig = {}) => API.del(apiName, path, clientConfig),
  };
};

export default useApi;
