import type { LabOrder, LabOrderId } from '../../../contracts/laboratory.contract';

class LaboratoryRepository {
  private orders = new Map<LabOrderId, LabOrder>();

  saveOrder(order: LabOrder): LabOrder {
    this.orders.set(order.id, { ...order, updatedAt: new Date() });
    return this.orders.get(order.id)!;
  }

  getOrder(id: LabOrderId): LabOrder | undefined {
    return this.orders.get(id);
  }

  listOrders(branchId: string): LabOrder[] {
    return Array.from(this.orders.values()).filter((o) => o.branchId === branchId);
  }
}

export const laboratoryRepository = new LaboratoryRepository();
