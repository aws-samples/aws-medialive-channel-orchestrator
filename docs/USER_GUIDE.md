## User Guide
This section describes how to install, configure and use the AWS MediaLive Channel Orchestrator.

- [Pre-requisites](#pre-requisites)
- [Deployment](#deployment)
- [Using the web app](#using-the-web-app)
- [Uninstalling](#uninstalling)

## Pre-requisites
To deploy this sample you will need to install:
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [NodeJS v14+](https://nodejs.org/en/download/)
- (Windows only) WSL or another Unix-like shell (e.g. Cygwin or similar)
- (Optional) [Git](https://git-scm.com/downloads)

After installing these pre-requisites, clone this repository (or manually download it):

```bash
git clone https://github.com/aws-samples/aws-medialive-channel-orchestrator.git
```

Then install the UI dependencies from the project root:

```bash
cd aws-medialive-channel-orchestrator
npm install
```

You should also already have AWS MediaLive Channels created and configured
in the account in which this sample is being deployed. This sample only
manages existing channels and does not create/delete channels nor does it
configure the channel inputs, destinations etc.

## Deployment

There are two stages to deploying:
1. Deploy the backend infrastructure
2. Deploy the frontend application

### Deploy the backend infrastructure

Run the following command from the repository root to deploy the backend:

```bash
sam deploy --guided --stack-name medialive-channel-orchestrator
```

Enter a stack name and region and either accept the default values for the stack
parameters or override them as required. The parameters for the stack are:

- **Stage:** (Default: dev) The environment stage (e.g. dev, test) for this deployment
- **AccessLogsBucket:** (Default: "") The name of the bucket to use for storing the Web UI access logs.
  Leave blank to disable UI access logging. Ensure the provided bucket has the [appropriate
  permissions configured](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/AccessLogs.html#AccessLogsBucketAndFileOwnership)
- **AccessControlAllowOriginOverride:** (Default: "") Allows overriding the origin from which the API
  can be called. If left blank, the API will only accept requests from the Web UI origin.
- **DefaultUserEmail:** (Default: "") The email address you wish to setup as the initial user in the
  Cognito User Pool. This email address will be sent a temporary password which must be changed
  upon logging in for the first time. Leave blank to skip creating an initial user.
- **CognitoAdvancedSecurity:** (Default: "OFF") The setting to use for [Cognito advanced security](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-settings-advanced-security.html).
  Allowed values for this parameter are: OFF, AUDIT and ENFORCED.
- **EnableBackups:** (Default: false) Whether to enable DynamoDB Point-in-Time Recovery for the
  DynamoDB tables. Enabling this feature will incur additional costs.
- **AlertExpiry:** (Default 12) The number of hours to retain cleared alert messages.
  Specify 0 to retain the alerts indefinitely

The stack will be deployed and config will be saved to `samconfig.toml`.
You can omit the `--guided` and `--stack-name` CLI options for subsequent deployments.

### Deploy the frontend infrastructure

To deploy the frontend infrastructure, run the following command:

```bash
npm run-script deploy
```

The `deploy` command does the following:
1. Generates an `.env` file using the stack outputs from the stack
   created in step 1
2. Builds the frontend application
3. Copies the resulting files to the Web UI S3 Bucket created as part
   of the backend infrastructure.

## Using the Web App

### Accessing the Web App

After completing the deployment steps UI is available at the `WebUrl` displayed in the stack outputs.
If you need to obtain the deployed web URL at any point, run the following command
from the project root:

```bash
npm run-script echo-ui-url
```

The application sets up a Cognito User Pool for user management and (optionally)
creates a default user. To add additional users, use the Cognito Console to manage
the user pool for the application as described in the [Cognito docs](https://docs.aws.amazon.com/cognito/latest/developerguide/managing-users.html).
The user pool ID is given in the stack outputs.

When accessing the web app URL, you will be prompted to login, after which
the application homepage will be displayed.

### Channel Controls

The channels that exist in your account will be displayed in the **Channel Selector** dropdown.
Use this selector to change which channel you are controlling. The status of the currently selected
channel is displayed in the **Channel Controls** section. You can start and stop a channel using
the **Start Channel** and **Stop Channel** buttons.

### Input Management

All inputs which are attached to the currently selected channel will be displayed
in the Inputs table along with a field indicating whether the input is the active input
attachment for the channel pipeline. Inputs can also be [prepared](https://docs.aws.amazon.com/medialive/latest/ug/feature-prepare-input.html)
using the **Prepare** button, and [input switching](https://docs.aws.amazon.com/medialive/latest/ug/scheduled-input-switching.html)
can be performed using the **Switch** button. The prepare and switch buttons for an input
are asynchronous operations that add an input prepare and input switch respectively
with an immediate start to the channel schedule.

### Output Confidence Monitoring

The web app displays a video player which will play the "outputs" configured for the
solution to facilitate output confidence monitoring. To configure the visible outputs,
choose the **Config** page from the navbar then choose the channel for which you wish
to specify outputs, and select the **Outputs** tab. Choose the **Add New** button
and provide a logical name and the stream url (e.g. a HLS index/playlist url) for
the outputs you wish to monitor. Once added these outputs will be stored in a DynamoDB
table and displayed on the web app homepage. This allows an operator to view the live
output whilst making changes to the channel state, inputs or graphics.

When configuring outputs, the web app will automatically discover and display the URLs for
any AWS MediaPackage destinations associated with the selected channel.

### Channel Alerts

Any alerts received relating to a channel will be displayed in the **Channel Alerts**
section. Where an alert is active it will have a status of SET. Once an alert is
cleared, the status will change to CLEARED and the alert will be removed altogether
once it has been in the CLEARED state for the "alert expiry" period configured when
deploying the application.

### Motion Graphics Overlays

**This section applies only to motion graphics overlays. [Static image overlays](https://docs.aws.amazon.com/medialive/latest/ug/working-with-image-overlay.html) are not currently supported.**

The web app provides controls for users to insert motion graphics overlays into a channel. A user can
select a graphic from the graphic selector and choose **Insert** which will add an immediate
activate motion graphic action to the channel schedule. Choose the **Stop Graphics** button
to remove all graphics by inserting an immediate deactivate motion graphics action to the
channel schedule. Motion graphics controls for a channel will only be enabled if the channel has
motion graphics enabled.

To configure the available graphics for a channel, choose the **Config** page from the navbar
then choose the channel for which you wish to specify outputs, and select the **Graphics** tab.
Choose the **Add New** button and provide a logical name and the **fixed** url for the graphic.
Once added these outputs will be stored in a DynamoDB table and available in the graphic selector.

For more info on motion graphics with AWS MediaLive, [consult the docs](https://docs.aws.amazon.com/medialive/latest/ug/feature-mgi.html).

## Uninstalling

To delete this project from your AWS account, you will need to first delete all objects
from the web UI S3 bucket. Once done, delete the application CloudFormation stack. To
delete the stack via AWS Console:

1. Open the CloudFormation Console Page and choose the solution stack, then choose "Delete"
2. Once the confirmation modal appears, choose "Delete stack".
3. Wait for the CloudFormation stack to finish updating. Completion is indicated when the "Stack status" is "DELETE_COMPLETE".

To delete a stack via the AWS CLI [consult the documentation](https://docs.aws.amazon.com/cli/latest/reference/cloudformation/delete-stack.html).
