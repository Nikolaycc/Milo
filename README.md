# Milo

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

Initialize a server by calling `Milo`:

```typescript
// my-milo-app/app.ts
import { Milo } from "@milo/core";
-- or --
import { Milo } from "jsr:@milo/core";

const milo = new Milo({
  port: 3000,
  hostname: "0.0.0.0",
  fsRouteDir: "/api",
});

milo.run();
```

## **TODO**

- [ ] Image Optimization
- [ ] Impl Middleware
- [ ] In-memory cache routes
- [ ] Impl WebSockets
