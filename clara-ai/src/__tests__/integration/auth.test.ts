import { describe, it, expect } from "vitest";
import { appRouter, createCaller } from "~/server/api/root";

describe("API root (integration)", () => {
  it("createCaller est une fonction", () => {
    expect(createCaller).toBeDefined();
    expect(typeof createCaller).toBe("function");
  });

  it("appRouter expose les routers attendus", () => {
    expect(appRouter.auth).toBeDefined();
    expect(appRouter.user).toBeDefined();
    expect(appRouter.settings).toBeDefined();
    expect(appRouter.userModels).toBeDefined();
    expect(appRouter.openai).toBeDefined();
  });
});
