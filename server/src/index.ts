import express from 'express';
import { createServer } from 'http';
import WebSocket from 'ws';

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());

// Basic routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// WebSocket connection
wss.on('connection', (ws) => {
  console.log('New client connected');
  
  ws.on('message', (message) => {
    console.log('received: %s', message);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
