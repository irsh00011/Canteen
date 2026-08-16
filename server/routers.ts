import { and, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { billItems, billSequences, bills, products } from "../drizzle/schema";
import { getDb } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

const money = z.number().finite().nonnegative();
const quantity = z.number().int().positive().max(999);

function indiaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(date).replaceAll("-", "");
}

function indiaDayRange() {
  const key = indiaDateKey();
  const start = new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(4, 6)) - 1, Number(key.slice(6, 8),), -5, -30));
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

export function buildBillNumber(dateKey: string, nextNumber: number) {
  return `KBA-${dateKey}-${String(nextNumber).padStart(3, "0")}`;
}

export function priceSnapshot(unitPrice: number, quantity: number) {
  return { unitPrice, totalPrice: Number((unitPrice * quantity).toFixed(2)) };
}

export function aggregateReport(billTotals: number[], itemQuantities: number[]) {
  return { totalBills: billTotals.length, totalItems: itemQuantities.reduce((sum, quantity) => sum + quantity, 0), totalSales: billTotals.reduce((sum, total) => sum + total, 0) };
}

export function isActiveBill(archivedAt: Date | null | undefined) {
  return archivedAt == null;
}

export function buildCsv(rows: Array<{ billNumber: string; date: string; time: string; product: string; quantity: number; unitPrice: number; total: number }>) {
  const header = "Bill Number,Date,Time,Product,Quantity,Unit Price,Total";
  const lines = rows.map(row => [row.billNumber, row.date, row.time, `"${row.product.replaceAll('"', '""')}"`, row.quantity, row.unitPrice.toFixed(2), row.total.toFixed(2)].join(","));
  return [header, ...lines].join("\n");
}

function normalizeProduct(product: typeof products.$inferSelect) {
  return { ...product, price: Number(product.price) };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  products: router({
    list: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(async ({ input }) => {
      const db = await getDb(); if (!db) return [];
      const search = input?.search?.trim();
      const rows = search ? await db.select().from(products).where(and(eq(products.status, "active"), or(like(products.name, `%${search}%`), like(products.productCode, `%${search}%`)))).orderBy(products.name) : await db.select().from(products).where(eq(products.status, "active")).orderBy(products.name);
      return rows.map(normalizeProduct);
    }),
    all: adminProcedure.query(async () => { const db = await getDb(); if (!db) return []; return (await db.select().from(products).orderBy(products.name)).map(normalizeProduct); }),
    getByCode: protectedProcedure.input(z.object({ code: z.string().min(1) })).query(async ({ input }) => { const db = await getDb(); if (!db) return null; const rows = await db.select().from(products).where(and(eq(products.productCode, input.code.trim()), eq(products.status, "active"))).limit(1); return rows[0] ? normalizeProduct(rows[0]) : null; }),
    create: adminProcedure.input(z.object({ productCode: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(160), category: z.string().trim().min(1).max(100), price: money })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.insert(products).values({ ...input, price: input.price.toFixed(2) }); return { success: true }; }),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), productCode: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(160), category: z.string().trim().min(1).max(100), price: money, status: z.enum(["active", "disabled"]) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const { id, ...values } = input; await db.update(products).set({ ...values, price: input.price.toFixed(2) }).where(eq(products.id, id)); return { success: true }; }),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(products).where(eq(products.id, input.id)); return { success: true }; }),
  }),
  bills: router({
    create: protectedProcedure.input(z.object({ items: z.array(z.object({ productId: z.number().int().positive(), quantity })).min(1) })).mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const rows = await db.select().from(products).where(eq(products.status, "active"));
      const selected = input.items.map(item => { const product = rows.find(row => row.id === item.productId); if (!product) throw new Error("One or more products are unavailable"); const unitPrice = Number(product.price); return { productId: product.id, productName: product.name, quantity: item.quantity, ...priceSnapshot(unitPrice, item.quantity) }; });
      const total = selected.reduce((sum, item) => sum + item.totalPrice, 0); const dateKey = indiaDateKey();
      const result = await db.transaction(async tx => {
        await tx.insert(billSequences).values({ dateKey, nextNumber: 2 }).onDuplicateKeyUpdate({ set: { nextNumber: sql`${billSequences.nextNumber} + 1` } });
        const sequence = await tx.select({ nextNumber: billSequences.nextNumber }).from(billSequences).where(eq(billSequences.dateKey, dateKey)).limit(1);
        const next = sequence[0]?.nextNumber ? sequence[0].nextNumber - 1 : 1;
        const billNumber = buildBillNumber(dateKey, next);
        const inserted = await tx.insert(bills).values({ billNumber, totalAmount: total.toFixed(2) }); const billId = Number((inserted as any).insertId);
        await tx.insert(billItems).values(selected.map(item => ({ ...item, billId, unitPrice: item.unitPrice.toFixed(2), totalPrice: item.totalPrice.toFixed(2) })));
        return { billNumber, billId };
      });
      return { ...result, total };
    }),
  }),
  reports: router({
    today: adminProcedure.query(async () => { const db = await getDb(); if (!db) return { totalBills: 0, totalItems: 0, totalSales: 0, transactions: [] }; const { start, end } = indiaDayRange(); const rows = await db.select().from(bills).where(and(sql`${bills.createdAt} >= ${start}`, sql`${bills.createdAt} < ${end}`, isNull(bills.archivedAt))).orderBy(desc(bills.createdAt)); const items = rows.length ? await db.select().from(billItems).where(sql`${billItems.billId} IN (${sql.join(rows.map(row => sql`${row.id}`), sql`, `)})`) : []; return { totalBills: rows.length, totalItems: items.reduce((sum, item) => sum + item.quantity, 0), totalSales: rows.reduce((sum, bill) => sum + Number(bill.totalAmount), 0), transactions: rows.map(bill => ({ billNumber: bill.billNumber, time: new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }).format(bill.createdAt), amount: Number(bill.totalAmount) })) }; }),
    csv: adminProcedure.query(async () => { const db = await getDb(); if (!db) return "Bill Number,Date,Time,Product,Quantity,Unit Price,Total\n"; const { start, end } = indiaDayRange(); const rows = await db.select({ bill: bills, item: billItems }).from(bills).innerJoin(billItems, eq(bills.id, billItems.billId)).where(and(sql`${bills.createdAt} >= ${start}`, sql`${bills.createdAt} < ${end}`, isNull(bills.archivedAt))).orderBy(desc(bills.createdAt)); const header = "Bill Number,Date,Time,Product,Quantity,Unit Price,Total"; const lines = rows.map(({ bill, item }) => { const date = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric" }).format(bill.createdAt); const time = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }).format(bill.createdAt); return [bill.billNumber, date, time, `"${item.productName.replaceAll('"', '""')}"`, item.quantity, Number(item.unitPrice).toFixed(2), Number(item.totalPrice).toFixed(2)].join(","); }); return [header, ...lines].join("\n"); }),
    archiveToday: adminProcedure.mutation(async () => { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const { start, end } = indiaDayRange(); await db.update(bills).set({ archivedAt: new Date() }).where(and(sql`${bills.createdAt} >= ${start}`, sql`${bills.createdAt} < ${end}`, isNull(bills.archivedAt))); return { success: true }; }),
  }),
});

export type AppRouter = typeof appRouter;
