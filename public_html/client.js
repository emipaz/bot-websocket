const socket = new WebSocket('ws://localhost:12345');
const time = 60000 // 1 minuto
let session_id = null;

socket.onopen = () => {
    console.log('Conexcion exitosa');
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);

    if (!session_id) {
        session_id = data.session_id;
    }

    const responseArea = document.getElementById('responseArea');
    responseArea.innerHTML += `<p>Respuesta: ${data.reply}</p>`;

    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
        console.log('Cerrando conección por inactividad');
        sendCloseSessionMessage();
        socket.close();
    }, time);  // 1 minuto de inactividad
};

socket.onclose = () => {
    console.log('Connection closed');
    // Aquí puedes realizar cualquier acción al finalizar
};

document.getElementById('messageForm').addEventListener('submit', (event) => {
    event.preventDefault();
    sendMessage();
});

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = {
        message: messageInput.value
    };
    socket.send(JSON.stringify(message));
    messageInput.value = '';
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
        console.log('Closing due to inactivity');
        sendCloseSessionMessage();
        socket.close();
    }, 60000);  // 1 minuto de inactividad
}

function sendCloseSessionMessage() {
    if (session_id) {
        const message = {
            session_id: session_id,
            close_session: true
        };
        socket.send(JSON.stringify(message));
    }
}

let inactivityTimeout;

