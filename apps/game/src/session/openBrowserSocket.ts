import type { OpenSocket } from './socket';

/** A real browser WebSocket. */
export const openBrowserSocket: OpenSocket = (url, handlers) => {
  const ws = new WebSocket(url);
  let finished = false;
  let seated = false;
  let lastPong = Date.now();
  const cleanup = () => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', resume);
    window.removeEventListener('pageshow', resume);
    window.removeEventListener('offline', fail);
  };
  const finish = (code: number) => {
    if (finished) return;
    finished = true;
    cleanup();
    handlers.close(code);
  };
  const fail = () => {
    finish(4002);
    ws.close(4002, 'connection check timed out');
  };
  const check = () => {
    if (finished || !seated) return;
    if (Date.now() - lastPong >= 15000) return fail();
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
    else fail();
  };
  const resume = () => {
    if (document.visibilityState !== 'hidden') check();
  };
  const timer = setInterval(check, 5000);
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('pageshow', resume);
  window.addEventListener('offline', fail);
  ws.addEventListener('open', () => handlers.open());
  ws.addEventListener('message', (e) => {
    if (finished || typeof e.data !== 'string') return;
    try {
      const msg = JSON.parse(e.data) as { type?: string };
      if (msg.type === 'pong') {
        lastPong = Date.now();
        return;
      }
      if (msg.type === 'welcome') {
        seated = true;
        lastPong = Date.now();
        check();
      }
    } catch {
      /* The session handles malformed messages. */
    }
    handlers.message(e.data);
  });
  ws.addEventListener('close', (e) => finish(e.code));
  ws.addEventListener('error', fail);
  return {
    send(data) {
      if (finished) return;
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
      else if (seated) fail();
    },
    close() {
      finished = true;
      cleanup();
      ws.close(1000);
    },
  };
};
