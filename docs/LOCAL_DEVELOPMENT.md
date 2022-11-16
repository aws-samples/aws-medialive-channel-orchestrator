# Local Development

## Pre-requisites
In addition to the pre-requisites mentioned in the [user guide](./USER_GUIDE.md#pre-requisites),
for local development you will also need:

- [Python 3.9+](https://www.python.org/downloads/)
- (Optional) [pipenv](https://pipenv.pypa.io/en/latest/)

## Setup
For local development, you will need to:

1. [Deploy the backend infrastructure](./USER_GUIDE.md#deployment) overriding
   the `AccessControlAllowOriginOverride` stack parameter with `http://localhost:3000`
2. Generate a config file

### Generate a Config File

To generate the frontend config file (`.env.local`), run:

```bash
npm run-script config
```

This will generate a `.env.local` file which contains the required configuration for the frontend
application. To start the frontend locally, run:

```bash
npm start
```

For more info on using dotenv files in CRA, [see the docs](https://create-react-app.dev/docs/adding-custom-environment-variables/#adding-development-environment-variables-in-env).
