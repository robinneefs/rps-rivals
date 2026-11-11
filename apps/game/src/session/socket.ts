/** The little a session needs from a WebSocket, so tests can hand it a fake one. */
export interface Socket {
  send(data: string): void;
  close(): void;
}

export interface SocketHandlers {
  open(): void;
  message(data: string): void;
  /** The connection ended (also when it never opened). `code` is the WebSocket close code. */
  close(code: number): void;
}

export type OpenSocket = (url: string, handlers: SocketHandlers) => Socket;
