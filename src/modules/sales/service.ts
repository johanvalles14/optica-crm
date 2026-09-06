import { randomUUID } from 'node:crypto';
import type { ActorContext } from '../../../contracts/auth.contract';
import type {
  CreateSaleOrderInput,
  ISalesService,
  PaymentMethod,
  PaymentRecord,
  RecordPaymentInput,
  SaleItem,
  SaleOrder,
  SaleOrderId,
  TicketPrintData,
} from '../../../contracts/sales.contract';
import { authorize } from '../auth/rbac';
import { AuditService } from '../audit/service';
import { inventoryRepository } from '../inventory/repository';
import { OrderStateMachine } from './state-machine';
import { salesRepository } from './repository';
import { formatTicketData } from './ticket.service';

const stateMachine = new OrderStateMachine();
let saleSequence = 1;

export class SalesService implements ISalesService {
  private audit = new AuditService();

  private consumeInventory(
    items: Array<Pick<SaleItem, 'productId' | 'quantity'>>,
    branchId: string,
    actor: ActorContext,
    note: string
  ): void {
    const quantities = new Map<string, number>();
    for (const item of items) {
      if (item.productId) {
        quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
      }
    }

    const products = new Map<string, NonNullable<ReturnType<typeof inventoryRepository.getProduct>>>();
    for (const [productId, quantity] of quantities) {
      const product = inventoryRepository.getProduct(productId);
      if (!product) throw new Error('Producto no encontrado');
      if (product.stock < quantity) throw new Error('Stock insuficiente');
      products.set(productId, product);
    }

    for (const [productId, quantity] of quantities) {
      const product = products.get(productId)!;
      const previousStock = product.stock;
      product.stock -= quantity;
      inventoryRepository.saveProduct(product);
      inventoryRepository.saveMovement({
        id: randomUUID(),
        productId: product.id,
        internalCode: product.internalCode,
        branchId,
        movementType: 'out',
        quantityChange: -quantity,
        previousStock,
        newStock: product.stock,
        reason: 'sale',
        notes: note,
        actorId: actor.actorId,
        occurredAt: new Date(),
      });
    }
  }

  async createOrder(
    input: CreateSaleOrderInput,
    actor: ActorContext
  ): Promise<SaleOrder> {
    if (!authorize(actor.role, 'createOrder', 'SaleOrder')) {
      throw new Error('Permission denied');
    }

    if (!input.items || input.items.length === 0) {
      throw new Error('La orden de venta debe contener al menos un producto o servicio');
    }
    if (input.prescriptionId && salesRepository.hasActiveOrderForPrescription(input.prescriptionId)) {
      throw new Error('La prescripción ya tiene una cotización u orden activa');
    }

    let subtotal = 0;
    const items: SaleItem[] = [];

    for (const raw of input.items) {
      if (raw.quantity <= 0 || raw.unitPrice < 0) {
        throw new Error('Cantidad y precio inválidos');
      }
      if (raw.productId && !inventoryRepository.getProduct(raw.productId)) {
        throw new Error('Producto no encontrado');
      }
      const totalPrice = raw.unitPrice * raw.quantity;
      subtotal += totalPrice;

      items.push({
        ...raw,
        id: randomUUID(),
        totalPrice,
      });

    }

    const discount = input.discount ?? 0;
    const total = Math.max(0, subtotal - discount);

    const folio = `VTA-${(saleSequence++).toString().padStart(4, '0')}`;
    const now = new Date();
    const payments: PaymentRecord[] = [];
    const paidAmount = input.initialPayment?.amount ?? 0;
    if (paidAmount < 0) throw new Error('El anticipo no puede ser negativo');

    if (paidAmount > 0) {
      this.consumeInventory(items, input.branchId, actor, 'Venta confirmada en mostrador');
    }

    if (input.initialPayment && paidAmount > 0) {
      const pRecord: PaymentRecord = {
        id: randomUUID(),
        amount: input.initialPayment.amount,
        method: input.initialPayment.method,
        reference: input.initialPayment.reference,
        receivedBy: actor.actorId,
        paidAt: now,
      };
      payments.push(pRecord);
      salesRepository.savePayment(pRecord);
    }

    const balanceDue = Math.max(0, total - paidAmount);
    const initialStatus = paidAmount > 0 ? 'confirmed_in_process' : 'quote';

    const order: SaleOrder = {
      id: randomUUID(),
      folio,
      branchId: input.branchId,
      patientId: input.patientId,
      patientName: input.patientName,
      prescriptionId: input.prescriptionId,
      status: initialStatus,
      items,
      subtotal,
      discount,
      total,
      paidAmount,
      balanceDue,
      promisedDeliveryDate: input.promisedDeliveryDate,
      notes: input.notes,
      version: 1,
      payments,
      createdAt: now,
      updatedAt: now,
    };

    salesRepository.saveOrder(order);

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'create',
      entity: 'SaleOrder',
      entityId: order.id,
      requestId: actor.requestId,
      metadata: { folio: order.folio, total, paidAmount },
    });

    return order;
  }

  async recordPayment(
    input: RecordPaymentInput,
    actor: ActorContext
  ): Promise<SaleOrder> {
    if (!authorize(actor.role, 'recordPayment', 'SaleOrder')) {
      throw new Error('Permission denied');
    }

    const order = salesRepository.getOrder(input.orderId);
    if (!order) throw new Error('Orden no encontrada');
    if (stateMachine.isFinal(order.status)) {
      throw new Error('No se pueden registrar pagos en órdenes finalizadas o canceladas');
    }
    if (order.version !== input.expectedVersion) {
      throw new Error('Stale version: expectedVersion does not match');
    }
    if (input.amount <= 0) throw new Error('El pago debe ser mayor a cero');

    const confirmsOrder =
      (order.status === 'quote' || order.status === 'pending_deposit') && input.amount > 0;
    if (confirmsOrder) {
      this.consumeInventory(order.items, order.branchId, actor, `Confirmación de cotización ${order.folio}`);
    }

    const pRecord: PaymentRecord = {
      id: randomUUID(),
      amount: input.amount,
      method: input.method,
      reference: input.reference,
      receivedBy: actor.actorId,
      paidAt: new Date(),
    };

    order.payments.push(pRecord);
    salesRepository.savePayment(pRecord);

    order.paidAmount += input.amount;
    order.balanceDue = Math.max(0, order.total - order.paidAmount);

    if (confirmsOrder) {
      order.status = stateMachine.transition(order.status, 'receive_deposit');
    }

    order.version += 1;
    salesRepository.saveOrder(order);

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'update',
      entity: 'SaleOrder',
      entityId: order.id,
      requestId: actor.requestId,
      metadata: { paymentAmount: input.amount, balanceDue: order.balanceDue },
    });

    return order;
  }

  async markReadyForDelivery(
    orderId: SaleOrderId,
    expectedVersion: number,
    actor: ActorContext
  ): Promise<SaleOrder> {
    const order = salesRepository.getOrder(orderId);
    if (!order) throw new Error('Orden no encontrada');

    if (order.status === 'quote' || order.status === 'pending_deposit') {
      throw new Error('La cotización requiere un anticipo antes de enviarse a preparación');
    }
    order.status = stateMachine.transition(order.status, 'mark_ready');

    order.version = expectedVersion + 1;
    salesRepository.saveOrder(order);
    return order;
  }

  async deliverAndClose(
    orderId: SaleOrderId,
    finalPayment: { amount: number; method: PaymentMethod } | undefined,
    expectedVersion: number,
    actor: ActorContext
  ): Promise<SaleOrder> {
    if (!authorize(actor.role, 'deliver', 'SaleOrder')) {
      throw new Error('Permission denied');
    }

    const order = salesRepository.getOrder(orderId);
    if (!order) throw new Error('Orden no encontrada');

    if (finalPayment && finalPayment.amount > 0) {
      const pRecord: PaymentRecord = {
        id: randomUUID(),
        amount: finalPayment.amount,
        method: finalPayment.method,
        receivedBy: actor.actorId,
        paidAt: new Date(),
      };
      order.payments.push(pRecord);
      salesRepository.savePayment(pRecord);
      order.paidAmount += finalPayment.amount;
      order.balanceDue = Math.max(0, order.total - order.paidAmount);
    }

    if (order.balanceDue > 0) {
      throw new Error(
        `No se pueden entregar los lentes con saldo pendiente ($${order.balanceDue}). Se requiere liquidación previa.`
      );
    }

    if (order.status === 'confirmed_in_process') {
      order.status = stateMachine.transition(order.status, 'mark_ready');
    }
    order.status = stateMachine.transition(order.status, 'deliver');
    order.deliveredAt = new Date();
    order.version = expectedVersion + 1;

    salesRepository.saveOrder(order);

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'update',
      entity: 'SaleOrder',
      entityId: order.id,
      requestId: actor.requestId,
      metadata: { action: 'deliverAndClose', folio: order.folio },
    });

    return order;
  }

  async cancelOrder(
    orderId: SaleOrderId,
    reason: string,
    expectedVersion: number,
    actor: ActorContext
  ): Promise<SaleOrder> {
    if (!authorize(actor.role, 'cancel', 'SaleOrder')) {
      throw new Error('Permission denied: solo administradores pueden cancelar órdenes');
    }

    const order = salesRepository.getOrder(orderId);
    if (!order) throw new Error('Orden no encontrada');
    if (stateMachine.isFinal(order.status)) {
      throw new Error('La orden ya se encuentra en estado final');
    }

    // Una cotización no compromete inventario; solo se revierte una orden confirmada.
    const inventoryWasCommitted = order.status !== 'quote' && order.status !== 'pending_deposit';
    for (const item of inventoryWasCommitted ? order.items : []) {
      if (item.productId) {
        const prod = inventoryRepository.getProduct(item.productId);
        if (prod) {
          prod.stock += item.quantity;
          inventoryRepository.saveProduct(prod);

          inventoryRepository.saveMovement({
            id: randomUUID(),
            productId: prod.id,
            internalCode: prod.internalCode,
            branchId: order.branchId,
            movementType: 'in',
            quantityChange: item.quantity,
            previousStock: prod.stock - item.quantity,
            newStock: prod.stock,
            reason: 'sale_cancelled',
            notes: `Reversión por orden cancelada ${order.folio}: ${reason}`,
            actorId: actor.actorId,
            occurredAt: new Date(),
          });
        }
      }
    }

    order.status = stateMachine.transition(order.status, 'cancel');
    order.notes = [order.notes, `CANCELADA: ${reason}`].filter(Boolean).join(' | ');
    order.version = expectedVersion + 1;

    salesRepository.saveOrder(order);

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'update',
      entity: 'SaleOrder',
      entityId: order.id,
      requestId: actor.requestId,
      reason,
      metadata: { action: 'cancelOrder' },
    });

    return order;
  }

  async getOrder(orderId: SaleOrderId, _actor: ActorContext): Promise<SaleOrder | null> {
    const order = salesRepository.getOrder(orderId);
    return order ?? null;
  }

  async getTicketData(orderId: SaleOrderId, _actor: ActorContext): Promise<TicketPrintData> {
    const order = salesRepository.getOrder(orderId);
    if (!order) throw new Error('Orden no encontrada');
    return formatTicketData(order);
  }
}
