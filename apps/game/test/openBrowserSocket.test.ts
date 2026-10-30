import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openBrowserSocket } from '../src/session/openBrowserSocket';

class FakeSocket extends EventTarget {
  static OPEN = 1;
  static latest: FakeSocket;
  readyState = 1;
  sent: string[] = [];
  close = vi.fn();
  constructor() {
    super();
    FakeSocket.latest = this;
  }
  send(data: string) {
    this.sent.push(data);
  }
  message(type: string) {
    this.dispatchEvent(Object.assign(new Event('message'), { data: JSON.stringify({ type }) }));
  }
}

describe('browser connection checks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', FakeSocket);
    vi.stubGlobal('document', Object.assign(new EventTarget(), { visibilityState: 'visible' }));
    vi.stubGlobal('window', new EventTarget());
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  const connect = () => {
    const close = vi.fn();
    const socket = openBrowserSocket('wss://example.test', { open: vi.fn(), message: vi.fn(), close });
    const ws = FakeSocket.latest;
    ws.message('welcome');
    return { socket, ws, close };
  };
  it('ends once when the server stops answering, without a websocket close event', () => {
    const { ws, close } = connect();
    vi.advanceTimersByTime(15000);
    expect(close).toHaveBeenCalledExactlyOnceWith(4002);
    expect(ws.close).toHaveBeenCalled();
    vi.advanceTimersByTime(30000);
    expect(close).toHaveBeenCalledTimes(1);
  });
  it('keeps a responsive connection alive and removes checks on deliberate leave', () => {
    const { socket, ws, close } = connect();
    for (let i = 0; i < 10; i++) {
      vi.advanceTimersByTime(5000);
      ws.message('pong');
    }
    expect(close).not.toHaveBeenCalled();
    socket.close();
    vi.advanceTimersByTime(30000);
    expect(close).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('detects a stale connection immediately on waking from a suspended page', () => {
    const { close } = connect();
    vi.setSystemTime(Date.now() + 20000);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(close).toHaveBeenCalledExactlyOnceWith(4002);
  });
  it('checks a suspended connection on focus even without a visibilitychange event', () => {
    const { close } = connect();
    vi.setSystemTime(Date.now() + 20000);
    window.dispatchEvent(new Event('focus'));
    expect(close).toHaveBeenCalledExactlyOnceWith(4002);
  });
});
