import { describe, expect, it } from "vitest";

import { splitGross } from "./vatMath";

describe("splitGross", () => {
  it("23%: rozłoży brutto na netto VAT", () => {
    const { net, vat } = splitGross(123, "23%");
    expect(net + vat).toBeCloseTo(123, 2);
    expect(vat).toBeCloseTo(23, 0);
  });

  it("ZW/NP/0%: całość bez VAT", () => {
    expect(splitGross(100, "ZW")).toEqual({ net: 100, vat: 0 });
    expect(splitGross(50, "NP")).toEqual({ net: 50, vat: 0 });
    expect(splitGross(99.99, "0%")).toEqual({ net: 99.99, vat: 0 });
  });
});
