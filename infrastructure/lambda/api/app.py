from itertools import chain

import schemas
import uuid
import json
from os import getenv

import boto3
from boto3.dynamodb.conditions import Key
from urllib.parse import unquote, urlparse

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import (
    APIGatewayRestResolver,
    CORSConfig,
    Response,
    content_types,
)
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.validation import validate
from aws_lambda_powertools.event_handler.exceptions import (
    NotFoundError, BadRequestError)
from aws_lambda_powertools.utilities.validation import SchemaValidationError

cors_origin = getenv("ALLOW_ORIGIN", "*")
tracer = Tracer()
logger = Logger(service="APP")
cors_config = CORSConfig(allow_origin=cors_origin, max_age=300)
app = APIGatewayRestResolver(cors=cors_config)

session = boto3.Session()
medialive = session.client('medialive')
mediapackage = session.client('mediapackage')
dynamodb = session.resource('dynamodb')
table = dynamodb.Table(getenv('CHANNEL_TABLE'))


@app.exception_handler(medialive.exceptions.NotFoundException)
def handle_not_found(ex):
    metadata = {"path": app.current_event.path,
                "query_strings": app.current_event.query_string_parameters}
    logger.error(f"Not found: {ex}", extra=metadata)

    return Response(status_code=404)


@app.exception_handler(medialive.exceptions.UnprocessableEntityException)
def handle_unprocessable_entity(ex):
    return handle_invalid_request(ex)


@app.exception_handler(SchemaValidationError)
def handle_schema_validation(ex):
    return handle_invalid_request(ex)


@app.exception_handler(BadRequestError)
def handle_bad_request(ex):
    return handle_invalid_request(ex)


def handle_invalid_request(ex):
    metadata = {"path": app.current_event.path,
                "query_strings": app.current_event.query_string_parameters}
    logger.error(f"Bad input: {ex}", extra=metadata)

    return Response(
        status_code=400,
        content_type=content_types.APPLICATION_JSON,
        body=json.dumps({"message": "The request parameters were invalid."})
    )


@app.exception_handler(medialive.exceptions.TooManyRequestsException)
def handle_throttle(ex):
    metadata = {"path": app.current_event.path,
                "query_strings": app.current_event.query_string_parameters}
    logger.error(f"Throttled request: {ex}", extra=metadata)

    return Response(
        status_code=429,
        content_type=content_types.APPLICATION_JSON,
        body=json.dumps(
            {"message": "The request was throttled, please try again."})
    )


@app.exception_handler(Exception)
def handle_other_errors(ex):
    metadata = {"path": app.current_event.path,
                "query_strings": app.current_event.query_string_parameters}
    logger.error(f"General exception: {ex}", extra=metadata)

    return Response(
        status_code=502,
        content_type=content_types.APPLICATION_JSON,
        body=json.dumps({"message": "Something went wrong, please try again."})
    )


@app.get("/channels")
@tracer.capture_method
def get_channels():
    ml_channels = _get_ml_channels()

    return {
        'Channels': ml_channels,
    }


@app.get("/channels/<channel_id>")
@tracer.capture_method
def get_channel_data(channel_id):
    # Validate channel exists
    channel = medialive.describe_channel(ChannelId=channel_id)

    response = table.query(
        KeyConditionExpression=Key('ChannelId').eq(channel_id),
    )

    outputs, graphics, alerts = [], [], []
    invalid = {"SK", "ChannelId", "ExpiresAt"}

    for item in response['Items']:
        if item['SK'].startswith('GRAPHIC#'):
            graphics.append({x: item[x] for x in item if x not in invalid})
        elif item['SK'].startswith('OUTPUT#'):
            outputs.append({x: item[x] for x in item if x not in invalid})
        elif item['SK'].startswith('ALERT#'):
            alerts.append({x: item[x] for x in item if x not in invalid})
        else:
            logger.warning('Unidentified channel entry', item)

    return {
        'ChannelId': channel_id,
        'Outputs': outputs,
        'Graphics': graphics,
        'Alerts': alerts,
        'GraphicsEnabled': channel.get("EncoderSettings", {})
                               .get("MotionGraphicsConfiguration", {})
                               .get("MotionGraphicsInsertion") == "ENABLED"
    }


@app.put("/channels/<channel_id>/status/<status>")
@tracer.capture_method
def put_channel_status(channel_id, status):
    status = status.lower()
    if status not in ['start', 'stop']:
        raise BadRequestError(f'Given status: {status} is not a valid status.')

    return _update_channel_status(channel_id, status)


@app.put("/channels/<channel_id>/activeinput/<input_name>")
@tracer.capture_method
def put_active_input(channel_id, input_name):

    action_name = str(uuid.uuid4())
    action = {
        'ActionName': action_name,
        'ScheduleActionSettings': {
            'InputSwitchSettings': {
                'InputAttachmentNameReference': unquote(input_name),
            }
        },
        'ScheduleActionStartSettings': {
            'ImmediateModeScheduleActionStartSettings': {}
        }
    }
    _write_schedule_item(channel_id, action)
    return {
        "ActiveInput": input_name
    }


@app.post("/channels/<channel_id>/prepareinput/<input_name>")
@tracer.capture_method
def post_input_prepare(channel_id, input_name):

    action_name = str(uuid.uuid4())
    action = {
        'ActionName': action_name,
        'ScheduleActionSettings': {
            'InputPrepareSettings': {
                'InputAttachmentNameReference': unquote(input_name)
            }
        },
        'ScheduleActionStartSettings': {
            'ImmediateModeScheduleActionStartSettings': {}
        }
    }
    _write_schedule_item(channel_id, action)


@app.post("/channels/<channel_id>/graphics/<graphic_id>/start")
@tracer.capture_method
def post_start_graphics(channel_id, graphic_id):
    validate(event=app.current_event.json_body,
             schema=schemas.start_graphics_body)

    duration = app.current_event.json_body.get('Duration', 0)

    item = table.get_item(
        Key={
            'ChannelId': channel_id,
            'SK': f'GRAPHIC#{graphic_id}'
        }
    ).get('Item')

    if not item:
        raise NotFoundError

    action_name = str(uuid.uuid4())
    action = {
        'ActionName': action_name,
        'ScheduleActionSettings': {
            'MotionGraphicsImageActivateSettings': {
                'Duration': duration,
                'Url': item['Url'],
            },
        },
        'ScheduleActionStartSettings': {
            'ImmediateModeScheduleActionStartSettings': {}
        }
    }
    _write_schedule_item(channel_id, action)


@app.post("/channels/<channel_id>/graphics/stop")
@tracer.capture_method
def post_stop_graphics(channel_id):

    action_name = str(uuid.uuid4())
    action = {
        'ActionName': action_name,
        'ScheduleActionSettings': {
            'MotionGraphicsImageDeactivateSettings': {}
        },
        'ScheduleActionStartSettings': {
            'ImmediateModeScheduleActionStartSettings': {}
        }
    }
    _write_schedule_item(channel_id, action)


@app.post("/channels/<channel_id>/graphics")
@tracer.capture_method
def post_graphic(channel_id):
    validate(event=app.current_event.json_body,
             schema=schemas.post_graphic_body)

    # Validate channel exists
    medialive.describe_channel(ChannelId=channel_id)

    new_id = str(uuid.uuid4())
    item = {
        'ChannelId': channel_id,
        'SK': f'GRAPHIC#{new_id}',
        'Id': new_id
    }

    item.update(app.current_event.json_body)

    table.put_item(Item=item)

    return {key: value for key, value in item.items() if key != 'SK'}


@app.delete("/channels/<channel_id>/graphics/<graphic_id>")
@tracer.capture_method
def delete_graphic(channel_id, graphic_id):

    table.delete_item(
        Key={
            'ChannelId': channel_id,
            'SK': f'GRAPHIC#{graphic_id}'
        }
    )

    return Response(status_code=204)


@app.post("/channels/<channel_id>/outputs")
@tracer.capture_method
def post_output(channel_id):
    validate(event=app.current_event.json_body,
             schema=schemas.post_output_body)

    # Validate channel exists
    medialive.describe_channel(ChannelId=channel_id)

    new_id = str(uuid.uuid4())
    item = {
        'ChannelId': channel_id,
        'SK': f'OUTPUT#{new_id}',
        'Id': new_id
    }

    item.update(app.current_event.json_body)

    table.put_item(Item=item)

    return {key: value for key, value in item.items() if key != 'SK'}


@app.delete("/channels/<channel_id>/outputs/<output_id>")
@tracer.capture_method
def delete_output(channel_id, output_id):

    table.delete_item(
        Key={
            'ChannelId': channel_id,
            'SK': f'OUTPUT#{output_id}'
        }
    )

    return Response(status_code=204)


@app.get("/channels/<channel_id>/outputs/discover")
@tracer.capture_method
def discover_outputs(channel_id):
    channel = medialive.describe_channel(ChannelId=channel_id)
    mp_channel_ids = [
        i["ChannelId"] for i in
        _get_channel_mp_destinations(channel)
    ]
    results = []
    paginator = mediapackage.get_paginator('list_origin_endpoints')
    page_iterator = paginator.paginate()

    for page in page_iterator:
        for endpoint in page['OriginEndpoints']:
            if endpoint["ChannelId"] in mp_channel_ids and any(i in endpoint for i in ["HlsPackage", "DashPackage"]):
                results.append({
                    "Name": endpoint["Id"],
                    "Url": endpoint["Url"],
                    "Type": "MEDIA_PACKAGE",
                    "OutputMetadata": {
                        "ChannelId": endpoint["ChannelId"],
                    }
                })
    return {"Outputs": results}


@tracer.capture_method
def _get_channel_mp_destinations(channel_data):
    dests = channel_data.get("Destinations", [])
    return list(chain(*[i.get("MediaPackageSettings") for i in dests if len(i.get("MediaPackageSettings", [])) > 0]))


@tracer.capture_method
def _write_schedule_item(channel_id, schedule_action):
    response = medialive.batch_update_schedule(
        ChannelId=channel_id,
        Creates={
            'ScheduleActions': [
                schedule_action
            ]
        }
    )
    return response


@tracer.capture_method
def _get_ml_channels():
    results = []
    paginator = medialive.get_paginator('list_channels')
    page_iterator = paginator.paginate()

    for page in page_iterator:
        for channel in page['Channels']:
            channel_description = medialive.describe_channel(
                ChannelId=channel['Id'])

            results.append({
                'Id': channel['Id'],
                'State': channel['State'],
                'Name': channel.get('Name', ''),
                'InputAttachments': [
                    {
                        "Id": i["InputId"],
                        "Name": i["InputAttachmentName"],
                        "Active": _is_input_active(i, channel_description.get('PipelineDetails', [])),
                    }
                    for i in channel.get('InputAttachments', [])
                ],
            })

    return results


@tracer.capture_method
def _is_input_active(input_attachment, pipeline_details):
    if len(pipeline_details) == 0:
        return False
    return pipeline_details[0]["ActiveInputAttachmentName"] == input_attachment["InputAttachmentName"]


@tracer.capture_method
def _update_channel_status(channel_id, status):
    if status == 'stop':
        response = medialive.stop_channel(ChannelId=channel_id)
    else:
        response = medialive.start_channel(ChannelId=channel_id)

    return {'Id': response['Id'], 'State': response['State']}


def is_valid_url(url, qualifying=('scheme', 'netloc')):
    tokens = urlparse(url)
    return all([getattr(tokens, qualifying_attr)
                for qualifying_attr in qualifying])


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
def lambda_handler(event, context):
    return app.resolve(event, context)
