import { describe, expect, it } from "vitest";
import { sm2 } from "@/lib/spaced-repetition/sm2";

describe("sm2", () => {
  it("starts successful reviews at a one day interval", () => {
    expect(sm2({ repetitions: 0, interval: 1, easeFactor: 2.5, quality: 4 })).toEqual({
      nextInterval: 1,
      nextEaseFactor: 2.5,
      nextRepetitions: 1,
    });
  });

  it("uses the six day interval for the second successful review", () => {
    expect(sm2({ repetitions: 1, interval: 1, easeFactor: 2.5, quality: 5 })).toEqual({
      nextInterval: 6,
      nextEaseFactor: 2.6,
      nextRepetitions: 2,
    });
  });

  it("resets repetitions after a failed review and keeps ease above the floor", () => {
    expect(sm2({ repetitions: 5, interval: 30, easeFactor: 1.4, quality: 2 })).toEqual({
      nextInterval: 1,
      nextEaseFactor: 1.3,
      nextRepetitions: 0,
    });
  });
});
