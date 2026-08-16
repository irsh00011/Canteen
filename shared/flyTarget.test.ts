import { describe, expect, it } from "vitest";
import { getFlyTarget } from "./flyTarget";

describe("getFlyTarget", () => {
  it("uses a stable visible bottom target when the cart is below the viewport", () => {
    expect(getFlyTarget({ left: 10, top: 980, width: 360, height: 280, bottom: 1260 }, { width: 390, height: 844 })).toEqual({ x: 195, y: 694 });
  });

  it("routes to the visible cart when it is already on screen", () => {
    expect(getFlyTarget({ left: 20, top: 500, width: 350, height: 260, bottom: 760 }, { width: 390, height: 844 })).toEqual({ x: 272, y: 548 });
  });

  it("uses the supplied fixed cart anchor as a visible product-flight target", () => {
    expect(getFlyTarget({ left: 140, top: 704, width: 110, height: 42, bottom: 746 }, { width: 390, height: 844 })).toEqual({ x: 206, y: 725 });
  });
});
