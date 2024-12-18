import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidGenerator } from 'uuid';

import { states } from './model/state.js';

const PORT = 443;

const server = http.createServer();

// create websocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log(`Received message => ${message}`);
    try {
      const data = JSON.parse(message);

      if (data.messasge === 'fetch') {
        ws.send(
          JSON.stringify({
            success: true,
            message: 'fetch',
            data: states,
            source: 'server',
          })
        );
      } else if (data.message === 'update') {
        // find device
        let gadget = states.filter((state) => state.name === data.name);
        if (gadget.length > 0) {
          gadget = gadget[0];

          if (gadget.name === 'led') {
            gadget.state = data.state;

            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    success: true,
                    message: 'update',
                    data: gadget,
                    source: 'server',
                  })
                );
              }
            });
          } else if (gadget.name === 'potentiometer') {
            gadget.value = data.value;
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    success: true,
                    message: 'update',
                    data: gadget,
                    source: 'server',
                  })
                );
              }
            });
          } else {
            ws.send(
              JSON.stringify({
                success: false,
                message: 'update',
                data: 'State not found',
                source: 'server',
              })
            );
          }
        } else {
          ws.send(
            JSON.stringify({
              success: false,
              message: 'Unknown message',
              data: null,
            })
          );
        }
      } else {
        ws.send(
          JSON.stringify({
            success: false,
            message: 'Unknown message',
            data: null,
          })
        );
      }
    } catch (error) {
      ws.send('Error parsing JSON' + error?.message);
    }

    ws.send(`Hello, you sent => ${message}`);
  });
  ws.send('Hi there, I am a WebSocket server');

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Listening on http://localhost:' + PORT);
});
