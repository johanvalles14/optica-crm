import type { Invoice, InvoiceId } from '../../../contracts/billing.contract';

class BillingRepository {
  private invoices = new Map<InvoiceId, Invoice>();

  saveInvoice(invoice: Invoice): Invoice {
    this.invoices.set(invoice.id, { ...invoice, updatedAt: new Date() });
    return this.invoices.get(invoice.id)!;
  }

  getInvoice(id: InvoiceId): Invoice | undefined {
    return this.invoices.get(id);
  }

  getInvoiceBySaleOrder(saleOrderId: string): Invoice | undefined {
    for (const inv of this.invoices.values()) {
      if (inv.saleOrderId === saleOrderId && inv.status !== 'cancelled') {
        return inv;
      }
    }
    return undefined;
  }

  listInvoices(branchId?: string): Invoice[] {
    const all = Array.from(this.invoices.values());
    if (branchId) return all.filter((i) => i.branchId === branchId);
    return all;
  }
}

export const billingRepository = new BillingRepository();
