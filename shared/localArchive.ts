export type LocalBillArchiveRecord = {
  id: string;
  createdAt: string;
  archivedAt?: string;
  [key: string]: unknown;
};

export function archiveBillsForDate<T extends LocalBillArchiveRecord>(bills: T[], dayKey: string, archivedAt: string, toDayKey: (date: Date) => string) {
  return bills.map(bill => toDayKey(new Date(bill.createdAt)) === dayKey && !bill.archivedAt ? { ...bill, archivedAt } : bill);
}

export function activeBillsForDate<T extends LocalBillArchiveRecord>(bills: T[], dayKey: string, toDayKey: (date: Date) => string) {
  return bills.filter(bill => !bill.archivedAt && toDayKey(new Date(bill.createdAt)) === dayKey);
}
