import logging
from unittest import mock

import pytest
from importlib import import_module

from aws_lambda_powertools.utilities.validation import SchemaValidationError
from aws_lambda_powertools.event_handler.exceptions import (
    NotFoundError, BadRequestError)
from boto3.dynamodb.conditions import Key

logger = logging.getLogger(__name__)
ENV_REGION_KEY = 'AWS_DEFAULT_REGION'

channel_id = 'foo'


@pytest.fixture()
def app():
    yield import_module('app')


@pytest.fixture(autouse=True)
def reset_event(app):
    app.app.current_event = None


@pytest.mark.usefixtures('medialive_client', 'mediapackage_client', 'ddb_table', 'app')
class TestApp:
    def test_it_returns_channels(self, list_channels_stub, medialive_client, app):
        result = app.get_channels()
        assert result == {
            "Channels": [
                {
                    "Id": "abcdef01234567890",
                    "State": "IDLE",
                    "Name": "Channel 1",
                    "InputAttachments": [
                        {
                            "Id": "021345abcdef6789",
                            "Name": "Input 1",
                            "Active": True,
                        },
                        {
                            "Id": "021345abcdef6789",
                            "Name": "Input 2",
                            "Active": False,
                        },
                    ],
                }
            ]
        }

    def test_it_starts_channels(self, medialive_client, app):
        status = "start"

        medialive_client.start_channel.return_value = {
            "Id": channel_id,
            "State": "Starting"
        }
        result = app.put_channel_status(channel_id, status)
        assert result == {
            "Id": channel_id,
            "State": "Starting",
        }
        medialive_client.start_channel.assert_called_with(ChannelId=channel_id)

    def test_it_stops_channels(self, medialive_client, app):
        status = "stop"

        medialive_client.stop_channel.return_value = {
            "Id": channel_id,
            "State": "Stopping"
        }
        result = app.put_channel_status(channel_id, status)
        assert result == {
            "Id": channel_id,
            "State": "Stopping",
        }
        medialive_client.stop_channel.assert_called_with(ChannelId=channel_id)

    def test_it_throws_for_invalid_channel_state(self, app):
        status = "invalid"

        with pytest.raises(BadRequestError):
            app.put_channel_status(channel_id, status)

    def test_it_switches_inputs(self, medialive_client, app):
        input_name = 'Input 2'

        result = app.put_active_input(channel_id, input_name)
        assert result == {
            "ActiveInput": input_name
        }
        medialive_client.batch_update_schedule.assert_called_with(**{
            'ChannelId': channel_id,
            'Creates': {
                'ScheduleActions': [{
                    'ActionName': mock.ANY,
                    'ScheduleActionSettings': {
                        'InputSwitchSettings': {
                            'InputAttachmentNameReference': input_name
                        }
                    },
                    'ScheduleActionStartSettings': {'ImmediateModeScheduleActionStartSettings': {}}
                }]
            }
        })

    def test_it_prepares_inputs(self, medialive_client, app):
        input_name = 'Input 2'

        result = app.post_input_prepare(channel_id, input_name)
        assert result is None
        medialive_client.batch_update_schedule.assert_called_with(**{
            'ChannelId': channel_id,
            'Creates': {
                'ScheduleActions': [{
                    'ActionName': mock.ANY,
                    'ScheduleActionSettings': {
                        'InputPrepareSettings': {
                            'InputAttachmentNameReference': input_name
                        }
                    },
                    'ScheduleActionStartSettings': {'ImmediateModeScheduleActionStartSettings': {}}
                }]
            }
        })

    def test_it_starts_motion_graphics_without_duration(self, ddb_table, medialive_client, app):
        graphic_id = '101'
        duration = 0
        url = 'https://example.com/output/12345678?aspect=16x9'

        app.app.current_event = mock.MagicMock()
        app.app.current_event.json_body = {}

        ddb_table.get_item.return_value = {
            'Item': {
                "ChannelId": channel_id,
                "Id": graphic_id,
                "Name": "Overlay 1",
                "SK": f'GRAPHIC#{graphic_id}',
                "Url": url
            }
        }

        result = app.post_start_graphics(channel_id, graphic_id)
        assert result is None
        medialive_client.batch_update_schedule.assert_called_with(**{
            'ChannelId': channel_id,
            'Creates': {
                'ScheduleActions': [{
                    'ActionName': mock.ANY,
                    'ScheduleActionSettings': {
                        'MotionGraphicsImageActivateSettings': {
                            'Duration': duration,
                            'Url': url,
                        },
                    },
                    'ScheduleActionStartSettings': {
                        'ImmediateModeScheduleActionStartSettings': {}
                    }
                }]
            }
        })

    def test_it_starts_motion_graphics_with_duration(self, ddb_table, medialive_client, app):
        graphic_id = '101'
        duration = 123
        url = 'https://example.com/output/12345678?aspect=16x9'

        app.app.current_event = mock.MagicMock()
        app.app.current_event.json_body = {'Duration': 123}

        ddb_table.get_item.return_value = {
            'Item': {
                "ChannelId": channel_id,
                "Id": graphic_id,
                "Name": "Overlay 1",
                "SK": f'GRAPHIC#{graphic_id}',
                "Url": url
            }
        }

        result = app.post_start_graphics(channel_id, graphic_id)
        assert result is None
        medialive_client.batch_update_schedule.assert_called_with(**{
            'ChannelId': channel_id,
            'Creates': {
                'ScheduleActions': [{
                    'ActionName': mock.ANY,
                    'ScheduleActionSettings': {
                        'MotionGraphicsImageActivateSettings': {
                            'Duration': duration,
                            'Url': url,
                        },
                    },
                    'ScheduleActionStartSettings': {
                        'ImmediateModeScheduleActionStartSettings': {}
                    }
                }]
            }
        })

    def test_it_throws_if_graphic_not_found(self, ddb_table, medialive_client, app):
        graphic_id = '101'

        app.app.current_event = mock.MagicMock()
        app.app.current_event.json_body = {'Duration': 123}

        ddb_table.get_item.return_value = {}

        with pytest.raises(NotFoundError):
            app.post_start_graphics(channel_id, graphic_id)

    def test_it_stops_motion_graphics(self, medialive_client, app):
        result = app.post_stop_graphics(channel_id)
        assert result is None
        medialive_client.batch_update_schedule.assert_called_with(**{
            'ChannelId': channel_id,
            'Creates': {
                'ScheduleActions': [{
                    'ActionName': mock.ANY,
                    'ScheduleActionSettings': {
                        'MotionGraphicsImageDeactivateSettings': {}
                    },
                    'ScheduleActionStartSettings': {
                        'ImmediateModeScheduleActionStartSettings': {}
                    }
                }]
            }})

    def test_it_returns_channel_data(self, ddb_table, medialive_client, app):
        result = app.get_channel_data(channel_id)
        assert result == {
            'ChannelId': channel_id,
            'Outputs': [
                {
                    'Id': '001',
                    'Url': 'https://www.example.com/embed/12345678',
                    'Name': 'Example'
                }
            ],
            'Graphics': [
                {
                    'Id': '101',
                    'Url': 'https://example.com/output/12345678?aspect=16x9',
                    'Name': 'Overlay 1'
                }
            ],
            'Alerts': [
                {
                    'Id': '100',
                    'Message': 'foobar',
                    'AlertedAt': 0,
                    'State': 'CLEARED'
                }
            ],
            'GraphicsEnabled': True,
        }
        ddb_table.query.assert_called_with(**{
            'KeyConditionExpression': Key('ChannelId').eq(channel_id)
        })
        medialive_client.describe_channel.assert_called_with(**{
            'ChannelId': channel_id
        })

    def test_it_returns_disabled_graphics(self, ddb_table, describe_channel_stub, medialive_client, app):
        describe_channel_stub["EncoderSettings"] = {
            "MotionGraphicsConfiguration": {
                "MotionGraphicsInsertion": "DISABLED",
                "MotionGraphicsSettings": {
                    "HtmlMotionGraphicsSettings": {}
                }
            }
        }

        result = app.get_channel_data(channel_id)
        assert result == {
            'ChannelId': channel_id,
            'Outputs': [
                {
                    'Id': '001',
                    'Url': 'https://www.example.com/embed/12345678',
                    'Name': 'Example'
                }
            ],
            'Graphics': [
                {
                    'Id': '101',
                    'Url': 'https://example.com/output/12345678?aspect=16x9',
                    'Name': 'Overlay 1'
                }
            ],
            'Alerts': [
                {
                    'Id': '100',
                    'Message': 'foobar',
                    'AlertedAt': 0,
                    'State': 'CLEARED'
                }
            ],
            'GraphicsEnabled': False,
        }
        ddb_table.query.assert_called_with(**{
            'KeyConditionExpression': Key('ChannelId').eq(channel_id)
        })
        medialive_client.describe_channel.assert_called_with(**{
            'ChannelId': channel_id
        })

    def test_it_deletes_outputs(self, ddb_table, app):
        output_id = '123'

        result = app.delete_output(channel_id, output_id)
        assert result.status_code == 204
        ddb_table.delete_item.assert_called_with(Key={
            'ChannelId': channel_id,
            'SK': f'OUTPUT#{output_id}'
        })

    def test_it_deletes_graphics(self, ddb_table, app):
        graphic_id = '123'

        result = app.delete_graphic(channel_id, graphic_id)
        assert result.status_code == 204
        ddb_table.delete_item.assert_called_with(Key={
            'ChannelId': channel_id,
            'SK': f'GRAPHIC#{graphic_id}'
        })

    def test_it_posts_output(self, ddb_table, medialive_client, app):
        url = 'https://example.com/output/12345678?aspect=16x9'
        name = 'My Output'

        app.app.current_event = mock.MagicMock()
        app.app.current_event.json_body = {
            'Url': url,
            'Name': name
        }

        result = app.post_output(channel_id)
        assert result == {
            'ChannelId': channel_id,
            'Id': mock.ANY,
            'Name': name,
            'Url': url
        }

        result_id = result['Id']
        ddb_table.put_item.assert_called_with(Item={
            'ChannelId': channel_id,
            'SK': f'OUTPUT#{result_id}',
            'Id': result_id,
            'Url': url,
            'Name': name
        })
        medialive_client.describe_channel.assert_called_with(**{
            'ChannelId': channel_id
        })

    def test_it_posts_graphic(self, ddb_table, medialive_client, app):
        url = 'https://example.com/output/12345678?aspect=16x9'
        name = 'My Graphic'

        app.app.current_event = mock.MagicMock()
        app.app.current_event.json_body = {
            'Url': url,
            'Name': name
        }

        result = app.post_graphic(channel_id)
        assert result == {
            'ChannelId': channel_id,
            'Id': mock.ANY,
            'Name': name,
            'Url': url
        }

        result_id = result['Id']
        ddb_table.put_item.assert_called_with(Item={
            'ChannelId': channel_id,
            'SK': f'GRAPHIC#{result_id}',
            'Id': result_id,
            'Url': url,
            'Name': name
        })
        medialive_client.describe_channel.assert_called_with(**{
            'ChannelId': channel_id
        })

    def test_it_throws_with_invalid_data(self, app):
        app.app.current_event = mock.MagicMock()
        app.app.current_event.json_body = {}

        with pytest.raises(SchemaValidationError):
            app.post_output(channel_id)

        with pytest.raises(SchemaValidationError):
            app.post_graphic(channel_id)

    def test_it_throws_with_additional_keys(self, app):
        url = 'https://example.com/output/12345678?aspect=16x9'
        name = 'My Graphic'
        app.app.current_event = mock.MagicMock()
        app.app.current_event.json_body = {
            'Url': url,
            'Name': name,
            'Invalid': 'key'
        }

        with pytest.raises(SchemaValidationError):
            app.post_output(channel_id)

        with pytest.raises(SchemaValidationError):
            app.post_graphic(channel_id)

    def test_it_discovers_mediapackage_outputs(self, app):
        result = app.discover_outputs(channel_id)
        assert result == {
            'Outputs': [{
                'Name': 'testDASHEndpoint',
                'OutputMetadata': {'ChannelId': 'test'},
                'Type': 'MEDIA_PACKAGE',
                'Url': 'https://abcdef01234567890.mediapackage.eu-west-1.amazonaws.com/out/v1/abcdef01234567890/index.mpd'
            }, {
                'Name': 'devHLSEndpoint',
                'OutputMetadata': {'ChannelId': 'test'},
                'Type': 'MEDIA_PACKAGE',
                'Url': 'https://abcdef01234567891.mediapackage.eu-west-1.amazonaws.com/out/v1/abcdef01234567891/index.m3u8'
            }]
        }

    def test_it_ignores_irrelevant_mediapackage_origin_endpoints(self, describe_channel_stub, app):
        describe_channel_stub["Destinations"] = [
            {
                "Id": "mediapackage-destination",
                "MediaPackageSettings": [
                    {
                        "ChannelId": "irrelevant"
                    }
                ],
                "Settings": []
            }
        ]

        result = app.discover_outputs(channel_id)
        assert result == {
            'Outputs': []
        }
