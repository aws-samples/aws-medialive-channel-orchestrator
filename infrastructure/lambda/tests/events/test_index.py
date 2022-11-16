import logging
from datetime import datetime
from unittest.mock import MagicMock

import pytest
from importlib import import_module

logger = logging.getLogger(__name__)


@pytest.fixture()
def app():
    yield import_module('index')


@pytest.fixture()
def event_stub():
    yield {
        "version": "0",
        "id": "faff4b2f-4ec9-53b6-ecd0-a53370b1c088",
        "detail-type": "MediaLive Channel Alert",
        "source": "aws.medialive",
        "account": "123456789012",
        "time": "1970-01-01T00:00:00Z",
        "region": "us-east-1",
        "resources": ["arn:aws:medialive:us-east-1:123456789012:channel:123456"],
        "detail": {
            "alarm_id": "foobar",
            "alert_type": "Stopped Receiving UDP Input",
            "alarm_state": "set",
            "channel_arn": "arn:aws:medialive:us-east-1:123456789012:channel:123456",
            "message": "Stopped receiving network data on [rtp://:5000]",
            "pipeline": "1"
        }
    }


@pytest.mark.usefixtures('ddb_table', 'app')
class TestEvents:
    def test_it_sets_alerts(self, event_stub, ddb_table, app):
        app.lambda_handler(event_stub, MagicMock())
        ddb_table.put_item.assert_called_with(
            Item={
                'ChannelId': '123456',
                'SK': 'ALERT#foobar',
                'Id': 'foobar',
                'State': 'SET',
                'Message': 'Stopped receiving network data on [rtp://:5000]',
                'AlertedAt': 0
            },
            ConditionExpression='attribute_not_exists(#SK) OR #AlertedAt < :AlertedAt',
            ExpressionAttributeNames={'#SK': 'SK', '#AlertedAt': 'AlertedAt'},
            ExpressionAttributeValues={':AlertedAt': 0}
        )

    def test_it_clears_alerts_with_ttl(self, event_stub, ddb_table, app):
        event_stub["detail"]["alarm_state"] = "cleared"
        app.lambda_handler(event_stub, MagicMock())
        ddb_table.put_item.assert_called_with(
            Item={
                'ChannelId': '123456',
                'SK': 'ALERT#foobar',
                'Id': 'foobar',
                'State': 'CLEARED',
                'Message': 'Stopped receiving network data on [rtp://:5000]',
                'AlertedAt': 0,
                'ExpiresAt': 3600
            },
            ConditionExpression='attribute_not_exists(#SK) OR #AlertedAt < :AlertedAt',
            ExpressionAttributeNames={'#SK': 'SK', '#AlertedAt': 'AlertedAt'},
            ExpressionAttributeValues={':AlertedAt': 0}
        )

    def test_it_omits_expires_at_when_ttl_configured_as_zero(self, event_stub, ddb_table, app):
        event_stub["detail"]["alarm_state"] = "cleared"
        app.alert_expiry = 0
        app.lambda_handler(event_stub, MagicMock())
        ddb_table.put_item.assert_called_with(
            Item={
                'ChannelId': '123456',
                'SK': 'ALERT#foobar',
                'Id': 'foobar',
                'State': 'CLEARED',
                'Message': 'Stopped receiving network data on [rtp://:5000]',
                'AlertedAt': 0
            },
            ConditionExpression='attribute_not_exists(#SK) OR #AlertedAt < :AlertedAt',
            ExpressionAttributeNames={'#SK': 'SK', '#AlertedAt': 'AlertedAt'},
            ExpressionAttributeValues={':AlertedAt': 0}
        )

    def test_it_handles_conditional_errors(self, event_stub, ddb_table, app):
        ddb_table.put_item.side_effect = [ddb_table.meta.client.ConditionalCheckFailedException()]
        app.lambda_handler(event_stub, MagicMock())

    def test_it_throws_for_malformed_events(self, event_stub, ddb_table, app):
        with pytest.raises(KeyError):
            app.lambda_handler({}, MagicMock())
