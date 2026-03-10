import { describe, it, expect } from "vitest";
import { cn } from "~/lib/utils";

describe("cn (utils)", () => {
  it("merge des classes de base", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("fusionne les classes Tailwind en conflit", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("ignore les valeurs falsy", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("gère les tableaux et objets conditionnels", () => {
    expect(cn(["a", "b"], { c: true, d: false })).toBe("a b c");
  });
});
