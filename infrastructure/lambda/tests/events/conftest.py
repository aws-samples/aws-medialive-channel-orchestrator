import logging
from unittest import mock
from unittest.mock import MagicMock

import pytest

logger = logging.getLogger(__name__)


@pytest.fixture()
def ddb_table(query_table_stub):
    mock_ddb = MagicMock()
    mock_ddb.put_item.return_value = {}
    with mock.patch("index.table", mock_ddb):
        yield mock_ddb
