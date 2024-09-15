# Milo

Milo is a lightweight, file-based HTTP framework built for Deno. It simplifies the creation of HTTP and WebSocket routes by dynamically generating them from a directory structure. Milo enables effortless route organization through a file system-based approach, making it easy to develop scalable and modular applications.

> [!WARNING]
> This framework is unfinished. Keep your expectations low.

**Basic usage**

Given a project with the following folder structure:

```bash
my-milo-app/
├─ api/
│  ├─ blog/
│  │  ├─ [id].ts
│  │  ├─ post.ts
│  │  ├─ index.ts
│  ├─ info.ts
│  ├─ index.ts
│  ├─ +ws.ts
├─ app.ts
```

Each "route file" must export as its default
export:

```typescript
// my-milo-app/api/blog/post.ts
export default (req: Request) => {
  return new Response("hello world!");
};
```

## HTTP Method Support
Milo now supports defining handlers for multiple HTTP methods in your route modules. You can export functions corresponding to HTTP methods like GET, POST, PUT, DELETE, etc., from each module to handle specific requests.

**Example Route Module** (`routes/example.ts`):
```ts
// Handle GET requests
export function GET(request: Request) {
  return new Response("GET request received");
}

// Handle POST requests
export function POST(request: Request) {
  return new Response("POST request received");
}

// Handle PUT requests
export function PUT(request: Request) {
  return new Response("PUT request received");
}
```

Run the **Milo** server, and the WebSocket routes will be automatically handled:

```typescript
// my-milo-app/app.ts
import { Milo } from "@milo/core";
// -- or --
import { Milo } from "jsr:@milo/core";

const milo = new Milo({
  port: 3000,
  hostname: "0.0.0.0",
  fsRouteDir: "/api",
});

milo.run();
```

## WebSocket Example
Milo supports WebSockets by allowing you to define WebSocket events in special files like `+ws.ts`. Here's an example of how to implement WebSocket functionality:

**Create a WebSocket** event handler file in your route directory.
```ts
// my-milo-app/api/+ws.ts

// Handle the 'open' event (when a client connects to the WebSocket).
export function open(socket: WebSocket) {
  console.log("Client connected!");
  socket.send("Welcome to Milo WebSocket!");
}

// Handle 'message' events (when a client sends a message).
export function message(socket: WebSocket, event: MessageEvent<string>) {
  console.log(`Message from client: ${event.data}`);
  socket.send(`Echo: ${event.data}`);
}

// Handle 'close' event (when the WebSocket is closed).
export function close(socket: WebSocket) {
  console.log("Client disconnected!");
}
```

Now, any WebSocket client connecting to `ws://localhost:3000` will trigger the events defined in `+ws.ts`.

## Project Description
Milo is designed to streamline the process of building server-side applications in Deno by leveraging a file-based routing system. It automatically generates HTTP and WebSocket routes from the file system, making route management intuitive and reducing boilerplate code. With Milo, you can easily define both static and dynamic routes using simple file naming conventions (e.g., [id].ts for parameterized routes).

**Key Features:**

- **File-Based Routing:** Organize routes by creating corresponding files, and Milo will automatically generate them based on the directory structure.
- **Dynamic Routes:** Create dynamic routes by using named placeholders in the file names (e.g., `[id].ts` maps to `/api/blog/:id`).
- **WebSocket Support:** Define WebSocket events in special files like +ws.ts for seamless WebSocket handling.
- **Modular and Scalable:** Keep your codebase clean by separating routes and WebSocket logic across different modules.
- **Deno Ecosystem:** Built natively for Deno, allowing you to take advantage of modern features and performance improvements.

## **TODO**

- [ ] Image Optimization
- [ ] Impl Middleware
- [ ] In-memory cache routes
- [X] Impl WebSockets
