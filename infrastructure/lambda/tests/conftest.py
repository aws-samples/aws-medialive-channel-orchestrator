import json
import logging
import os
from pathlib import Path
from unittest import mock

import pytest

logger = logging.getLogger(__name__)


@pytest.fixture(autouse=True, scope="module")
def env_vars():
    with mock.patch.dict(os.environ, {"AWS_DEFAULT_REGION": "us-east-1", "CHANNEL_TABLE": "CHANNEL_TABLE", "ALERT_EXPIRY": "1"}):
        yield


stubs_dir = Path(__file__).parent / "stubs"


def load_stub(stub_file):
    with open(stubs_dir / stub_file) as f:
        return json.load(f)


@pytest.fixture(scope="function")
def describe_channel_stub():
    return load_stub("describe_channel.json")


@pytest.fixture(scope="function")
def list_channels_stub():
    return load_stub("list_channels.json")


@pytest.fixture(scope="function")
def list_origin_endpoints_stub():
    return load_stub("list_origin_endpoints.json")


@pytest.fixture(scope="function")
def describe_channel_stub():
    return load_stub("describe_channel.json")


@pytest.fixture(scope="function")
def list_origin_endpoints_stub():
    return load_stub("list_origin_endpoints.json")


@pytest.fixture(scope="function")
def query_table_stub():
    return load_stub("query_table.json")
