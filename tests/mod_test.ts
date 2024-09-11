import { Milo } from "../mod.ts";

const milo = new Milo({
  port: 3000,
  hostname: "0.0.0.0",
  fsRouteDir: "/home/amnesia/Work/Milo/tests/api",
});
milo.run();
