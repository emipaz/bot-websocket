import asyncio
import websockets
import json
import jsonschema
from urllib.parse import urlparse, parse_qs
import uuid

SECRET_KEY = "tu_clave_secreta"

schema = {
    "type": "object",
    "properties": {
        "session_id": {"type": "string"},
        "message": {"type": "string"}
    },
    "required": ["session_id", "message"]
}

active_sessions = {}

async def handler(websocket, path):
    
    query_params = parse_qs(urlparse(path).query)
    token = query_params.get("token", [None])[0] 
    print(token)
    if not token:
        print("Token no proporcionado en la URL.")
        await websocket.close()
        return
    session_id = str(uuid.uuid4())
    active_sessions[session_id] = []
    print(f"New connection established. Session ID: {session_id}")
    response = {
                'session_id': session_id,}
    await websocket.send(json.dumps(response))

    try:
        async for message in websocket:
            data = json.loads(message)
            print(data)
            if not validate_message(data):
                print("Invalid message format")
                continue
            active_sessions[session_id].append(data['message'])
            print(f"Message received from session {session_id}: {data['message']}")
            response = {
                'session_id': session_id,
                'reply': f"Message received: {data['message']}"
            }
            await websocket.send(json.dumps(response))
    except websockets.exceptions.ConnectionClosed:
        print(f"Connection closed for session: {session_id}")
    finally:
        if session_id in active_sessions:
            print(f"Cleaning up session: {session_id}")
            del active_sessions[session_id]

def validate_message(data):
    try:
        jsonschema.validate(instance=data, schema=schema)
        return True
    except jsonschema.exceptions.ValidationError:
        return False

async def main():
    async with websockets.serve(handler, "localhost", 12345):
        print("WebSocket server started on ws://localhost:12345")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
