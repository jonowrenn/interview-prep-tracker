import { describe, expect, it } from "vitest";
import { computeStreak } from "@/lib/dashboard/data";

const now = new Date("2026-04-27T12:00:00.000Z");

describe("computeStreak", () => {
  it("counts consecutive dates ending today", () => {
    expect(computeStreak([
      { date: "2026-04-27" },
      { date: "2026-04-26" },
      { date: "2026-04-25" },
    ], now)).toBe(3);
  });

  it("allows streaks ending yesterday", () => {
    expect(computeStreak([
      { date: "2026-04-26" },
      { date: "2026-04-25" },
    ], now)).toBe(2);
  });

  it("stops at the first gap", () => {
    expect(computeStreak([
      { date: "2026-04-27" },
      { date: "2026-04-25" },
    ], now)).toBe(1);
  });

  it("returns zero when the latest activity is stale", () => {
    expect(computeStreak([{ date: "2026-04-24" }], now)).toBe(0);
  });
});
