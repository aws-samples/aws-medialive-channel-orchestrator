from datetime import datetime, timedelta
from os import getenv

import boto3
from aws_lambda_powertools.utilities.data_classes import event_source, EventBridgeEvent

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext

tracer = Tracer()
logger = Logger(service="EVENTS")

session = boto3.Session()
dynamodb = session.resource('dynamodb')
table = dynamodb.Table(getenv('CHANNEL_TABLE'))
alert_expiry = int(getenv('ALERT_EXPIRY', 12))


def process_event(event: EventBridgeEvent):
    try:
        alarm_id = event.detail["alarm_id"]
        alarm_state = event.detail["alarm_state"].upper()
        message = event.detail["message"]
        channel_id = event.detail["channel_arn"].split(":")[-1]
        logger.info(f"Received {alarm_state} alert for channel {channel_id}: {message} ({alarm_id})")
        event_datetime = datetime.strptime(event.time, '%Y-%m-%dT%H:%M:%S%z')
        event_ts = int(event_datetime.timestamp())
        params = {
            "ChannelId": channel_id,
            "SK": f"ALERT#{alarm_id}",
            "Id": alarm_id,
            "State": alarm_state,
            "Message": message,
            "AlertedAt": event_ts
        }
        if alarm_state == "CLEARED" and alert_expiry > 0:
            event_datetime = datetime.strptime(event.time, '%Y-%m-%dT%H:%M:%S%z')
            expiry = event_datetime + timedelta(hours=alert_expiry)
            params["ExpiresAt"] = int(expiry.timestamp())
        table.put_item(
            Item=params,
            ConditionExpression='attribute_not_exists(#SK) OR #AlertedAt < :AlertedAt',
            ExpressionAttributeNames={"#SK": "SK", "#AlertedAt": "AlertedAt"},
            ExpressionAttributeValues={':AlertedAt': event_ts}
        )
    except KeyError as err:
        logger.error(f"Invalid event received: {event.detail}")
        raise err
    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
        logger.warning("Skipping older alert")
    except dynamodb.meta.client.exceptions.ClientError as err:
        logger.error(f"Unable to write event to DynamoDB: {event.detail}")
        raise err


@logger.inject_lambda_context(correlation_id_path=correlation_paths.EVENT_BRIDGE)
@event_source(data_class=EventBridgeEvent)
def lambda_handler(event: EventBridgeEvent, context: LambdaContext):
    if "Alert" in event.detail_type and "MediaLive" in event.detail_type:
        process_event(event)
