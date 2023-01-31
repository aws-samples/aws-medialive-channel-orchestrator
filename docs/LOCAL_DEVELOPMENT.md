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

This will generate a `.env` file which contains the required configuration for the frontend
application. To start the frontend locally, run:

```bash
npm start
```
