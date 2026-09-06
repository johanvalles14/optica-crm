import type {
  PaymentId,
  PaymentRecord,
  SaleOrder,
  SaleOrderId,
} from '../../../contracts/sales.contract';

class SalesRepository {
  private orders = new Map<SaleOrderId, SaleOrder>();
  private payments = new Map<PaymentId, PaymentRecord>();

  saveOrder(order: SaleOrder): SaleOrder {
    this.orders.set(order.id, { ...order, updatedAt: new Date() });
    return this.orders.get(order.id)!;
  }

  getOrder(id: SaleOrderId): SaleOrder | undefined {
    return this.orders.get(id);
  }

  listOrders(branchId: string): SaleOrder[] {
    return Array.from(this.orders.values()).filter((o) => o.branchId === branchId);
  }

  savePayment(payment: PaymentRecord): PaymentRecord {
    this.payments.set(payment.id, payment);
    return payment;
  }
}

export const salesRepository = new SalesRepository();
