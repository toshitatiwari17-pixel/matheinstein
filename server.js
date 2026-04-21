/**
 * MathEinstein relay server
 * Simple multi-room WebSocket broadcaster + static file server.
 * Usage:  node server.js   (listens on http://localhost:8787)
 */
const http = require('http');
const fs   = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8787;
const ROOT = __dirname;

const MIME = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png',
  '.ico':'image/x-icon', '.map':'application/json'
};

const server = http.createServer((req, res) => {
  let url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (url === '/') url = '/index.html';
  const p = path.join(ROOT, url);
  if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(p, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(buf);
  });
});

const wss = new WebSocketServer({ server });

/** rooms: Map<roomCode, Set<ws>> */
const rooms = new Map();

function join(room, ws) {
  ws.room = room;
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room).add(ws);
}
function leave(ws) {
  const r = ws.room && rooms.get(ws.room);
  if (r) { r.delete(ws); if (!r.size) rooms.delete(ws.room); }
  // notify others that this peer left
  broadcast(ws.room, { type: 'peerLeft', from: ws.clientId, role: ws.userRole, name: ws.userName }, ws);
}
function broadcast(room, payload, except) {
  const set = room && rooms.get(room);
  if (!set) return;
  const data = JSON.stringify(payload);
  for (const c of set) {
    if (c === except) continue;
    if (c.readyState === 1) c.send(data);
  }
}

wss.on('connection', (ws) => {
  ws.on('message', (buf) => {
    let m;
    try { m = JSON.parse(buf.toString()); } catch { return; }
    if (m.type === 'join') {
      ws.clientId  = m.clientId || Math.random().toString(36).slice(2,10);
      ws.userRole  = m.role || 'solo';
      ws.userName  = m.name || 'Anon';
      join((m.room || 'CLASS-1').toUpperCase(), ws);
      // tell the joiner who else is in the room
      const peers = [...rooms.get(ws.room)].filter(c => c !== ws).map(c => ({
        clientId: c.clientId, role: c.userRole, name: c.userName
      }));
      ws.send(JSON.stringify({ type: 'welcome', clientId: ws.clientId, peers }));
      broadcast(ws.room, {
        type: 'peerJoined', from: ws.clientId, role: ws.userRole, name: ws.userName
      }, ws);
      return;
    }
    if (!ws.room) return;
    // stamp & rebroadcast
    m.from = ws.clientId; m.role = ws.userRole; m.name = ws.userName;
    if (m.to) {
      // direct message to a specific peer in room
      for (const c of rooms.get(ws.room) || []) {
        if (c.clientId === m.to && c.readyState === 1) c.send(JSON.stringify(m));
      }
    } else {
      broadcast(ws.room, m, ws);
    }
  });
  ws.on('close', () => leave(ws));
  ws.on('error', () => leave(ws));
});

server.listen(PORT, () => {
  console.log(`MathEinstein relay on http://localhost:${PORT}`);
});
