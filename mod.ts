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

async function createRoutes(path: string, basePath = ""): Promise<Route[]> {
  let res: Route[] = [];

  for await (const dirEntry of Deno.readDir(path)) {
    if (dirEntry.isDirectory) {
      const nestedRoutes = await createRoutes(
        Path.join(path, dirEntry.name),
        Path.parse(Path.join(path, dirEntry.name)).name,
      );
      res = res.concat(nestedRoutes);
    } else {
      const modulePath = Path.join(path, dirEntry.name);
      const module = await import(modulePath);

      if (module.default && typeof module.default === "function") {
        let routePath: string;
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
      } else {
        console.error(
          `No default export or not a function in module: ${modulePath}`,
        );
      }
    }
  }

  return res;
}

function route(
  routes: Route[],
  defaultHandler: (
    request: Request,
    info?: Deno.ServeHandlerInfo,
  ) => Response | Promise<Response>,
): (
  request: Request,
  info?: Deno.ServeHandlerInfo,
) => Response | Promise<Response> {
  return (request: Request, info?: Deno.ServeHandlerInfo) => {
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

export class Milo {
  options: MiloOptions;

  constructor(options: Partial<MiloOptions> = {}) {
    this.options = options as MiloOptions;
  }

  async run(): Promise<void> {
    const Routes = await createRoutes(this.options.fsRouteDir);
    Deno.serve(
      { port: this.options.port, hostname: this.options.hostname },
      route(Routes, () => new Response("404 not found")),
    );
  }
}
