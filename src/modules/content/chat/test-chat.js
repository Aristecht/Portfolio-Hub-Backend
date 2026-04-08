// Запуск: node src/modules/content/chat/test-chat.js

const { io } = require('socket.io-client');

// Скопируй cookie из браузера после входа (F12 → Application → Cookies)
const SESSION_COOKIE =
  's%3AVzoaSJi18SM50xtBvcoCKFMca8-WBM2I.d8OveBJnAE97OgdlHwaQiCJGGTS7BEQMTsIV7WIRhtc';

// Свой userId можно получить через GraphQL: query { me { id } }
const USER_ID = 'd23c0740-f85c-49d2-9240-b0c96620273d';

const socket = io('http://localhost:4000/chat', {
  withCredentials: true,
  reconnection: false,
  auth: {
    userId: USER_ID,
  },
  extraHeaders: {
    cookie: SESSION_COOKIE,
  },
});

socket.on('connect', () => {
  console.log('✅ CONNECTED, socket id:', socket.id);
});

socket.on('connect_error', err => {
  console.error('❌ CONNECTION ERROR:', err.message);
});

socket.on('error', msg => {
  console.error('❌ SERVER ERROR:', msg);
});

socket.on('message:new', data => {
  console.log('📩 NEW MESSAGE:', JSON.stringify(data, null, 2));
});

socket.on('message:sent', data => {
  console.log('✉️  SENT:', data);
});

socket.on('message:error', data => {
  console.error('❌ MESSAGE ERROR:', data);
});

socket.on('typing:user', data => {
  console.log('⌨️  TYPING:', data);
});

socket.on('user:online', data => {
  console.log('🟢 USER ONLINE:', data);
});

socket.on('user:offline', data => {
  console.log('🔴 USER OFFLINE:', data);
});

// NestJS WebSocket guard/exception errors come here
socket.on('exception', data => {
  console.error('🚨 EXCEPTION FROM SERVER:', JSON.stringify(data, null, 2));
});

// Catch-all: log any event not explicitly handled
const originalOnevent = socket.onevent.bind(socket);
socket.onevent = packet => {
  const [event, ...args] = packet.data || [];
  const handled = [
    'connect',
    'connect_error',
    'error',
    'message:new',
    'message:sent',
    'message:error',
    'typing:user',
    'user:online',
    'user:offline',
    'exception',
  ];
  if (!handled.includes(event)) {
    console.log(
      `📡 UNHANDLED EVENT [${event}]:`,
      JSON.stringify(args, null, 2),
    );
  }
  originalOnevent(packet);
};

// Замени chatId на реальный UUID из БД
const CHAT_ID = '3e8bc646-69ff-4bb0-887d-9c6d36358fae';

setTimeout(() => {
  console.log('📤 Sending message to chat:', CHAT_ID);
  socket.emit('message:send', {
    chatId: CHAT_ID,
    text: 'Hello from test script!',
  });

  // Keep alive 8s to receive all responses, then exit
  setTimeout(() => {
    console.log('🏁 Done. Disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 8000);
}, 2000);
