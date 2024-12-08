const token = "tu_clave_secreta";
const socket = new WebSocket(`ws://localhost:12345?token=${encodeURIComponent(token)}`);
const INACTIVITY_TIME = 60000; // 1 minuto
const ALERT_TIME = 30000; // Tiempo de alerta
let sessionId = null;
let inactivityTimeout;
let alertTimeout;
let conversationHistory = [];
const title = "Chatbot";

document.addEventListener("DOMContentLoaded", initializeChatbot);

function initializeChatbot() {
    injectHTML();
    injectGlobalStyles("./estilos_bot.css");
    setupEventListeners();
}

function injectHTML() {
    const contenidoHTML = `
        <div id="chatbot-circle">💬</div>
        <div id="chatbot-container" style="display: none;">
            <div id="chatbot-main">
                <h1>${title}</h1>
                <iframe id="chatbotFrame" src="" width="100%" height="400" frameborder="0"></iframe>
                <textarea id="inputQuestion" rows="4" placeholder="Escribe tu pregunta aquí..."></textarea>
                <button id="sendButton">Enviar</button>
                <p id="instructionText">Presiona Enter para enviar. Shift + Enter para un salto de línea.</p>
            </div>
        </div>`;
    const chatbotDiv = document.createElement("div");
    chatbotDiv.id = "chatbot";
    chatbotDiv.innerHTML = contenidoHTML;
    document.body.appendChild(chatbotDiv);
}

function injectGlobalStyles(href) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
}

function injectIframeStyles(iframeDocument, href) {
    if (!iframeDocument.querySelector(`link[href="${href}"]`)) {
        const link = iframeDocument.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        iframeDocument.head.appendChild(link);
    }
}

function setupEventListeners() {
    document.getElementById("chatbot-circle").addEventListener("click", toggleChatbot);
    document.getElementById("sendButton").addEventListener("click", sendQuestion);

    document.getElementById("inputQuestion").addEventListener("keydown", handleTextareaInput);
}

function handleTextareaInput(event) {
    if (event.key === "Enter") {
        if (event.shiftKey) {
            event.preventDefault();
            insertNewlineAtCursor(event.target);
        } else {
            event.preventDefault();
            sendQuestion();
        }
    }
}

function insertNewlineAtCursor(textarea) {
    const cursorPos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, cursorPos);
    const textAfter = textarea.value.substring(cursorPos);
    textarea.value = `${textBefore}\n${textAfter}`;
    textarea.selectionStart = textarea.selectionEnd = cursorPos + 1;
}

function toggleChatbot() {
    const container = document.getElementById("chatbot-container");
    const iframe = document.getElementById("chatbotFrame");
    const isHidden = container.style.display === "none" || container.style.display === "";
    container.style.display = isHidden ? "block" : "none";
    if (isHidden) scrollToBottom(iframe);
}

function scrollToBottom(iframe) {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframe.contentWindow.scrollTo(0, iframeDoc.body.scrollHeight);
}

function sendQuestion() {
    const input = document.getElementById("inputQuestion");
    const question = input.value.trim();
    if (!question) return;

    appendMessage("user", question);
    input.value = "";

    socket.send(JSON.stringify({ role: "user", content: question, session_id: sessionId }));
    resetInactivityTimeout();
}

function appendMessage(role, content) {
    const iframe = document.getElementById("chatbotFrame");
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    injectIframeStyles(iframeDoc, "./styles_msj.css");

    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role}-message`;
    messageDiv.innerHTML = `<strong>${role === "user" ? "Usuario" : "Bot"}:</strong> ${content}`;
    iframeDoc.body.appendChild(messageDiv);

    scrollToBottom(iframe);
}

function resetInactivityTimeout() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(showInactivityAlert, INACTIVITY_TIME);
}

function showInactivityAlert() {
    alertTimeout = setTimeout(closeSession, ALERT_TIME);
    console.log("Mostrando alerta por inactividad...");
}

function closeSession() {
    sendCloseSessionMessage();
    socket.close();
}

function sendCloseSessionMessage() {
    if (sessionId) {
        socket.send(JSON.stringify({ session_id: sessionId, close_session: true }));
    }
}

socket.onopen = () => console.log("Conexión exitosa");
socket.onmessage = (event) => handleSocketMessage(event);
socket.onclose = () => console.log("Conexión cerrada");

function handleSocketMessage(event) {
    const data = JSON.parse(event.data);
    if (!sessionId) sessionId = data.session_id;
    if (data.reply) appendMessage("bot", data.reply);
    resetInactivityTimeout();
}
