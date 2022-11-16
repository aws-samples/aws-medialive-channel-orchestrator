start_graphics_body = {
    "type": "object",
    "properties": {
        "Duration": {
            "type": "integer"
        }
    },
    "additionalProperties": False
}

post_output_body = {
    "type": "object",
    "properties": {
        "Url": {
            "type": "string"
        },
        "Name": {
            "type": "string"
        }
    },
    "required": ["Url", "Name"],
    "additionalProperties": False
}

post_graphic_body = post_output_body
