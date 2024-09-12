import * as Path from "@std/path";

type Handler = (
  request: Request,
  params?: Record<string, string | undefined>,
) => Response | Promise<Response>;

interface Route {
  pattern: URLPattern;
  method?: string;
  handler: Handler;
}

type WsMap = Map<
  string,
  (socket?: WebSocket, event?: MessageEvent<string>) => void
>;

/**
 * Recursively creates HTTP and WebSocket routes from a given directory.
 *
 * @param path - The root directory to scan for route modules.
 * @param basePath - An optional base path for nested routes.
 * @returns A tuple containing an array of routes and a WebSocket map.
 *
 * @example
 * ```ts
 * const [routes, wsMap] = await createRoutes("./routes");
 * ```
 */
async function createRoutes(
  path: string,
  basePath = "",
): Promise<[Route[], WsMap]> {
  let res: Route[] = [];
  const wsll: WsMap = new Map<
    string,
    (socket?: WebSocket, event?: MessageEvent<string>) => void
  >();

  for await (const dirEntry of Deno.readDir(path)) {
    if (dirEntry.isDirectory) {
      const [nestedRoutes, _] = await createRoutes(
        Path.join(path, dirEntry.name),
        Path.parse(Path.join(path, dirEntry.name)).name,
      );
      res = res.concat(nestedRoutes);
    } else {
      const modulePath = Path.join(path, dirEntry.name);
      const module = await import(modulePath);

      if (module.default && typeof module.default === "function") {
        let routePath: string = "";
        const regex = /\[(\w+)\]\.(ts|js)$/;
        const paramMatch = dirEntry.name.match(regex);

        if (dirEntry.name === "index.ts") {
          routePath = basePath === "" ? "/" : `/${basePath}`;
        } else if (paramMatch) {
          const paramName = paramMatch[1]; // This will be "id"
          routePath =
            basePath === "" ? `/:${paramName}` : `/${basePath}/:${paramName}`;
        } else {
          // For non-index.ts files, map them to their name
          const fileName = Path.parse(dirEntry.name).name;
          routePath = `/${basePath}/${fileName}`;
        }

        // Clean up double slashes in the route path
        routePath = routePath.replace(/\/+/g, "/");

        res.push({
          pattern: new URLPattern({
            pathname: routePath,
          }),
          method: "GET",
          handler: module.default,
        });
      } else if (dirEntry.name === "+ws.ts") {
        for (const evt of Object.keys(module)) {
          wsll.set(evt, module[evt]);
        }
      } else {
        console.error(
          `No default export or not a function in module: ${modulePath}`,
        );
      }
    }
  }

  return [res, wsll];
}

/**
 * Creates a request handler to match HTTP routes and WebSocket events.
 *
 * @param routes - The array of HTTP routes to handle.
 * @param wsall - The map of WebSocket events and handlers.
 * @param defaultHandler - The default handler to use for unmatched requests.
 * @returns A function to handle HTTP and WebSocket requests.
 */
function route(
  routes: Route[],
  wsall: WsMap,
  defaultHandler: (
    request: Request,
    info?: Deno.ServeHandlerInfo,
  ) => Response | Promise<Response>,
): (
  request: Request,
  info?: Deno.ServeHandlerInfo,
) => Response | Promise<Response> {
  return (request: Request, info?: Deno.ServeHandlerInfo) => {
    if (request.headers.get("upgrade") == "websocket") {
      const { socket, response } = Deno.upgradeWebSocket(request);
      wsall.forEach((val, key) => {
          socket.addEventListener(key, (event) => {
            if (event instanceof MessageEvent) {
              val(socket, event);
            } else {
              val(socket)
            }
        });
      });

      return response
    }

    for (const route of routes) {
      const params = route.pattern.exec(request.url);
      if (params && request.method === (route.method ?? "GET")) {
        return route.handler(request, params.pathname.groups);
      }
    }
    return defaultHandler(request, info);
  };
}

type MiloOptions = {
  port?: number;
  hostname?: string;
  fsRouteDir: string;
};

/**
 * The main class for the Milo framework. Handles routing and WebSocket integration.
 */
export class Milo {
  options: MiloOptions;

  /**
   * Constructs a new instance of Milo.
   *
   * @param options - The configuration options for Milo, such as port, hostname, and the file system route directory.
   */
  constructor(options: Partial<MiloOptions> = {}) {
    this.options = options as MiloOptions;
  }

  /**
   * Starts the server and serves the routes and WebSocket connections.
   *
   * @example
   * ```ts
   * const milo = new Milo({ port: 8000, fsRouteDir: "./routes" });
   * await milo.run();
   * ```
   */
  async run(): Promise<void> {
    const [Routes, Ws] = await createRoutes(this.options.fsRouteDir);
    Deno.serve(
      { port: this.options.port, hostname: this.options.hostname },
      route(Routes, Ws, () => new Response("404 not found")),
    );
  }
}
