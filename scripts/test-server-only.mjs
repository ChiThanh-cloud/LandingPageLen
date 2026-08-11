import Module from "node:module";

// Next.js enforces the server-only marker during its own build. Node's unit
// test runner has no equivalent module condition, so make the marker a no-op
// only for the test process in order to exercise server modules directly.
const originalLoad = Module._load;

Module._load = function loadForTests(request, parent, isMain) {
  if (request === "server-only") return {};
  return originalLoad.call(this, request, parent, isMain);
};
