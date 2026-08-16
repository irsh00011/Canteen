import { describe, expect, it } from "vitest";
import { aggregateReport, appRouter, buildBillNumber, buildCsv, isActiveBill, priceSnapshot } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: "user" | "admin"): TrpcContext {
  return {
    user: { id: 1, openId: `${role}-test`, email: `${role}@example.com`, name: role, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("KBA Canteen authorization and validation", () => {
  it("blocks cashier access to today's report", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.reports.today()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows admin access to today's report", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await expect(caller.reports.today()).resolves.toMatchObject({ totalBills: expect.any(Number), totalItems: expect.any(Number), totalSales: expect.any(Number) });
  });

  it("rejects non-positive bill quantities before database access", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.bills.create({ items: [{ productId: 1, quantity: 0 }] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("creates the exact daily bill-number format", () => {
    expect(buildBillNumber("20260816", 7)).toBe("KBA-20260816-007");
  });

  it("captures the unit price and line total at checkout", () => {
    expect(priceSnapshot(10, 3)).toEqual({ unitPrice: 10, totalPrice: 30 });
  });

  it("aggregates today's report totals", () => {
    expect(aggregateReport([20, 35], [2, 1])).toEqual({ totalBills: 2, totalItems: 3, totalSales: 55 });
  });

  it("produces the required CSV columns and escapes product names", () => {
    expect(buildCsv([{ billNumber: "KBA-20260816-001", date: "16/08/2026", time: "09:12", product: "Tea, Large", quantity: 2, unitPrice: 10, total: 20 }])).toBe('Bill Number,Date,Time,Product,Quantity,Unit Price,Total\nKBA-20260816-001,16/08/2026,09:12,"Tea, Large",2,10.00,20.00');
  });

  it("excludes soft-archived bills from active reporting", () => {
    expect(isActiveBill(null)).toBe(true);
    expect(isActiveBill(new Date())).toBe(false);
  });
});
