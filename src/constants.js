/************* ENVIRONMENT VARIABLES **************/
export const AWS_REGION = process.env.REACT_APP_AWS_REGION ?? "eu-west-1";
export const AWS_COGNITO_IDENTITY_POOL_ID =
  process.env.REACT_APP_AWS_COGNITO_IDENTITY_POOL_ID ??
  "<COGNITO_IDENTITY_POOL_ID>";
export const AWS_USER_POOL_ID =
  process.env.REACT_APP_AWS_USER_POOL_ID ?? "<COGNITO_USER_POOL_ID>";
export const AWS_USER_POOL_WEB_CLIENT_ID =
  process.env.REACT_APP_AWS_USER_POOL_WEB_CLIENT_ID ??
  "<COGNITO_WEB_CLIENT_ID>";
export const API_GATEWAY_ENDPOINT =
  process.env.REACT_APP_API_GATEWAY_ENDPOINT ?? "<API_URL_INCLUDING_STAGE>";
/************* END OF ENVIRONMENT VARIABLES **************/
export const RUNNING_STATE = "RUNNING";
export const IDLE_STATE = "IDLE";
export const UPDATE_FAILED = "UPDATE_FAILED";
export const startableStates = [IDLE_STATE, UPDATE_FAILED];
export const stoppableStates = [RUNNING_STATE];
