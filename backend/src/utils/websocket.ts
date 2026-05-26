import { WebSocket, WebSocketServer } from 'ws';
import type { JobProgress, WSMessage } from '../types/index';

let wss: WebSocketServer | null = null;
const clients = new Map<string, Set<WebSocket>>();

export function initWebSocketServer(port: number): WebSocketServer {
  wss = new WebSocketServer({ port });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`);
    const assignmentId = url.searchParams.get('assignmentId') || 'global';

    if (!clients.has(assignmentId)) {
      clients.set(assignmentId, new Set());
    }
    clients.get(assignmentId)!.add(ws);

    const connMsg: WSMessage = {
      type: 'CONNECTED',
      payload: { message: `Connected for assignment ${assignmentId}` },
    };
    ws.send(JSON.stringify(connMsg));

    ws.on('close', () => {
      clients.get(assignmentId)?.delete(ws);
      if (clients.get(assignmentId)?.size === 0) {
        clients.delete(assignmentId);
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket client error:', err.message);
    });
  });

  wss.on('error', (err) => {
    console.error('WebSocket server error:', err.message);
  });

  console.log(`🔌 WebSocket server running on port ${port}`);
  return wss;
}

export function broadcastJobProgress(assignmentId: string, progress: JobProgress): void {
  const msg: WSMessage = { type: 'JOB_PROGRESS', payload: progress };
  const msgStr = JSON.stringify(msg);

  const assignmentClients = clients.get(assignmentId);
  if (assignmentClients) {
    for (const client of assignmentClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msgStr);
      }
    }
  }

  // Also broadcast to global listeners
  const globalClients = clients.get('global');
  if (globalClients) {
    for (const client of globalClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msgStr);
      }
    }
  }
}

export function broadcastJobComplete(assignmentId: string, progress: JobProgress): void {
  const msg: WSMessage = { type: 'JOB_COMPLETE', payload: progress };
  const msgStr = JSON.stringify(msg);
  sendToAssignment(assignmentId, msgStr);
}

export function broadcastJobError(assignmentId: string, progress: JobProgress): void {
  const msg: WSMessage = { type: 'JOB_ERROR', payload: progress };
  const msgStr = JSON.stringify(msg);
  sendToAssignment(assignmentId, msgStr);
}

function sendToAssignment(assignmentId: string, msgStr: string): void {
  const assignmentClients = clients.get(assignmentId);
  if (assignmentClients) {
    for (const client of assignmentClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msgStr);
      }
    }
  }
  const globalClients = clients.get('global');
  if (globalClients) {
    for (const client of globalClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msgStr);
      }
    }
  }
}
