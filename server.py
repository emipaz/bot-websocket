import asyncio
import websockets
import json
import uuid

active_sessions = {}

async def handler(websocket, path):
    session_id = str(uuid.uuid4())
    active_sessions[session_id] = []

    print(f"Nueva Coneccion. Session ID: {session_id}")

    try:
        async for message in websocket:
            data = json.loads(message)
            print(data)
            if data.get('close_session'):
                print(f"Cerrando sesion {session_id}.")
                break

            active_sessions[session_id].append(data['message'])

            print(f"Mensaje Recibido de la sesion {session_id}: {data['message']}")

            response = {
                'session_id': session_id,
                'reply': f"{data['message']}"
            }

            await websocket.send(json.dumps(response))
    except websockets.exceptions.ConnectionClosed:
        print(f"coneccion cerrada: {session_id}")

    if session_id in active_sessions:
        print(f"Limpiando  session: {session_id}")
        del active_sessions[session_id]

async def main():
    async with websockets.serve(handler, "localhost", 12345):
        print("WebSocket server iniciado en ws://localhost:12345")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())

