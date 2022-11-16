import logging
from unittest import mock
from unittest.mock import MagicMock

import pytest

logger = logging.getLogger(__name__)


def generate_ml_resp(client, pagination_tuples):
    def side_effect(op_name):
        resp = next((result for call, result in pagination_tuples if call == op_name), None)
        if resp is not None:
            client.paginate.return_value = iter([resp])
        else:
            client.paginate.return_value = iter([])
        return client
    return side_effect


@pytest.fixture()
def medialive_client(list_channels_stub, describe_channel_stub):
    mock_ml = MagicMock()
    mock_ml.get_paginator.side_effect = generate_ml_resp(mock_ml, [("list_channels", list_channels_stub)])
    mock_ml.describe_channel.return_value = describe_channel_stub

    with mock.patch("app.medialive", mock_ml):
        yield mock_ml


@pytest.fixture()
def mediapackage_client(list_origin_endpoints_stub):
    mock_mp = MagicMock()
    mock_mp.get_paginator.side_effect = generate_ml_resp(mock_mp, [("list_origin_endpoints", list_origin_endpoints_stub)])

    with mock.patch("app.mediapackage", mock_mp):
        yield mock_mp


@pytest.fixture()
def ddb_table(query_table_stub):
    mock_ddb = MagicMock()
    mock_ddb.query.return_value = query_table_stub
    with mock.patch("app.table", mock_ddb):
        yield mock_ddb
