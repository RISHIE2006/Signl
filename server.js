import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const userSockets = new Map();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: dev ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_APP_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('authenticate', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        userSockets.set(socket.id, userId);
        console.log(`User ${userId} authenticated on socket ${socket.id}`);
      }
    });

    socket.on('subscribe:applications', (userId) => {
      if (userId) {
        socket.join(`apps:${userId}`);
      }
    });

    socket.on('subscribe:notifications', (userId) => {
      if (userId) {
        socket.join(`notifications:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      const userId = userSockets.get(socket.id);
      if (userId) {
        userSockets.delete(socket.id);
        console.log(`User ${userId} disconnected`);
      }
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  global.io = io;

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});