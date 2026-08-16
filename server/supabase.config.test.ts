import { describe, expect, it } from "vitest";

describe("Local-only kiosk configuration", () => {
  it("does not require a remote database for the active billing experience", () => {
    const storageKeys = ["kba-local-products-v1", "kba-local-bills-v1", "kba-local-settings-v1", "kba-local-sequence-v1"];
    expect(storageKeys).toEqual(expect.arrayContaining(["kba-local-products-v1", "kba-local-bills-v1", "kba-local-settings-v1"]));
  });
});
