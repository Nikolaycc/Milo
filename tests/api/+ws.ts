export function open(_socket: WebSocket) {
  console.log("a client connected!");
}

export function close(_socket: WebSocket) {
  console.log("a client closed!");
}

export function message(socket: WebSocket, event: MessageEvent<string>) {
  if (event.data === "ping") {
    socket.send("pong");
  } else {
    socket.send("UwU");
  }
}
