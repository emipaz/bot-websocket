const token = "tu_clave_secreta";
// const socket = new WebSocket("ws://localhost:12345", [], 
const socket = new WebSocket(`ws://localhost:12345?token=${encodeURIComponent(token)}`);
const time = 60000; // 1 minuto
let session_id = null;
let inactivityTimeout;
let alertTimeout;
let conversationHistory = [];
const title= "titulo";

document.addEventListener('DOMContentLoaded', 
    function() {
        const contenidoHTML = `<div id="chatbot-circle">💬</div>
            <div id="chatbot-container">
              <div id="chatbot-main"><h1>${title}</h1>
                <iframe id="chatbotFrame" src="" width="100%" height="400" frameborder="0">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                </iframe>
                <textarea id="inputQuestion" rows="4" placeholder="Escribe tu pregunta aquí..."></textarea>
                </textarea>
                <button id="sendButton">Enviar</button>
                <p id="instructionText">Presiona Enter para enviar. Shift + Enter para un salto de línea.</p>
              </div>
            </div>`;
        const nuevoDiv = document.createElement('div');
        nuevoDiv.id = 'chatbot';
        nuevoDiv.innerHTML = contenidoHTML;
        document.body.appendChild(nuevoDiv);
        // Agregar el evento de clic al círculo de chatbot
        document.getElementById('chatbot-circle').addEventListener('click', toggleChatbot);
        // Agregar el evento de clic al botón de enviar
        document.getElementById('sendButton').addEventListener('click', sendQuestion);
        // Agregar el evento de teclado para el envío y salto de línea
        document.getElementById('inputQuestion').addEventListener('keydown', 
            function(event) {
                if (event.key === 'Enter') {
                    if (event.shiftKey) {
                        // Salto de línea
                        event.preventDefault();
                        const cursorPos = this.selectionStart;
                        const textBeforeCursor = this.value.substring(0, cursorPos);
                        const textAfterCursor = this.value.substring(cursorPos);
                        this.value = textBeforeCursor + '\n' + textAfterCursor;
                        this.selectionStart = cursorPos + 1;
                        this.selectionEnd = cursorPos + 1;
                    } 
                else {
                    // Enviar mensaje
                    event.preventDefault();
                    sendQuestion();
                    }
                }
            }
        );
        botStyle();
    }
);

function botStyle() {
    const estilo = document.createElement('link');
    estilo.rel = 'stylesheet';
    estilo.href = "./estilos_bot.css";
    document.head.appendChild(estilo);
}

function injectStyles(iframeDocument) {
    const linkElement = iframeDocument.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = "./styles_msj.css"; // Asegúrate de poner la ruta correcta
    iframeDocument.head.appendChild(linkElement);    
}


function toggleChatbot() {
    const chatbotContainer = document.getElementById('chatbot-container');
    const iframe = document.getElementById('chatbotFrame');
    if (chatbotContainer.style.display === 'none' || chatbotContainer.style.display === '') {
        chatbotContainer.style.display = 'block';
        scrollToBottom(iframe);
    } else {
        chatbotContainer.style.display = 'none';
    }
}

function scrollToBottom(iframe) {
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    iframe.contentWindow.scrollTo(0, iframeDocument.body.scrollHeight);
} 

socket.onopen = () => {
    
    console.log('Conexion exitosa');
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
    
    if (!session_id) {
        session_id = data.session_id;
    }
    if (data.reply){
        
        const iframe = document.getElementById('chatbotFrame');
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
        if (!iframeDocument.querySelector('style')) {
            injectStyles(iframeDocument);
        }
        iframeDocument.getElementById('loading').remove();
        const botMessage = document.createElement('div');

        botMessage.className = 'message bot-message';
        botMessage.id = "MathJax_Display";
        // botMessage.className = 'display: none;';
        botMessage.innerHTML = `<strong>Bot:</strong> ${data.reply}`;
        iframeDocument.body.appendChild(botMessage);
    //const responseArea = document.getElementById('responseArea');
    //responseArea.innerHTML += `<p>Respuesta: ${data.reply}</p>`;

    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(showInactivityAlert, time);
}};

socket.onclose = () => {
    console.log('Connection closed');
    // Aquí puedes realizar cualquier acción al finalizar
};

document.getElementById('messageForm').addEventListener('submit', (event) => {
    event.preventDefault();
    sendMessage();
});

function sendQuestion() {
    
    const question = document.getElementById('inputQuestion').value;
    document.getElementById('inputQuestion').value = '';

    // Añadir la pregunta actual al historial de la conversación
    conversationHistory.push({ role: 'user', content: question });

    const iframe = document.getElementById('chatbotFrame');
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

    if (!iframeDocument.querySelector('style')) {
        injectStyles(iframeDocument);
    }

    /* if (!iframeDocument.querySelector('script')) {
        injectScripts(iframeDocument);
    }
    */

    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.innerHTML = `<strong>Usuario:</strong> ${question}`;
    iframeDocument.body.appendChild(userMessage);

    const loadingElement = document.createElement('div');
    loadingElement.id = 'loading';
    loadingElement.className = 'loading';
    iframeDocument.body.appendChild(loadingElement);

    scrollToBottom(iframe);
    
    socket.send(JSON.stringify({ role: 'user', content: question , session_id : session_id,}));
    messageInput.value = '';
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
        console.log('Closing due to inactivity');
        sendCloseSessionMessage();
        socket.close();
    }, 60000);  // 1 minuto de inactividad
}




/*
    fetch(api, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({
                query: question,
                history: conversationHistory,
                bot: bot,
                
            })
        })
        .then(response => response.json())
        .then(data => {
            // Eliminar el elemento de carga
            iframeDocument.getElementById('loading').remove();

            //agregar la respuesta al iframe
            const botMessage = document.createElement('div');
            botMessage.className = 'message bot-message';
            botMessage.id = "MathJax_Display";
            //botMessage.className = 'display: none;';
            botMessage.innerHTML = `<strong>${botName}:</strong> ${data.response}`;
            iframeDocument.body.appendChild(botMessage);

             // Reprocesar MathJax
            if (iframeDocument.defaultView.MathJax) {
    iframeDocument.defaultView.MathJax.Hub.Queue(["Typeset", iframeDocument.defaultView.MathJax.Hub, botMessage]);
}
            conversationHistory.push({ role: 'assistant', content: data.response });

            scrollToBottom(iframe);
        })
        .catch(error => {
            console.error('Error:', error);
            iframeDocument.getElementById('loading').remove();
        });
}
*/

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = {
        session_id : session_id,
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

function confirmAlert(userConfirmed) { 
    clearTimeout(alertTimeout); 
    const alertBox = document.getElementById('alertBox'); 
    alertBox.style.display = 'none'; 
    if (userConfirmed) { 
        clearTimeout(inactivityTimeout); 
        inactivityTimeout = setTimeout(showInactivityAlert, 60000); 
        // Reiniciar el temporizador 
        } 
    else { 
        sendCloseSessionMessage(); 
        socket.close(); 
        } 
    }

function showInactivityAlert() { 
    const alertBox = document.getElementById("alertBox");
    alertBox.style.display = "block";
    // iniciar conteo
    alterTimeout = setTimeout( () => {
        sendCloseSessionMessage();
        alertBox.style.display ="none";
        const responseArea = document.getElementById('responseArea');
        responseArea.innerHTML += `<p>Conexion Finalizada por inactividad</p>`;
        socket.close();
        }, 30000);
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

