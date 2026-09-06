import { randomUUID } from 'node:crypto';
import type { ActorContext } from '../../../contracts/auth.contract';
import type {
  CancelInvoiceInput,
  IBillingService,
  Invoice,
  InvoiceId,
  IssueInvoiceInput,
} from '../../../contracts/billing.contract';
import { authorize } from '../auth/rbac';
import { AuditService } from '../audit/service';
import { salesRepository } from '../sales/repository';
import { validateTaxProfile, mapPaymentMethodToSat } from './validators';
import { pacAdapter } from './pac-adapter';
import { billingRepository } from './repository';

let invoiceSequence = 1;

export class BillingService implements IBillingService {
  private audit = new AuditService();

  async issueInvoice(
    input: IssueInvoiceInput,
    actor: ActorContext
  ): Promise<Invoice> {
    if (!authorize(actor.role, 'issueInvoice', 'Invoice')) {
      throw new Error('Permission denied: no autorizado para emitir facturas fiscales');
    }

    validateTaxProfile(input.taxProfile);

    const order = salesRepository.getOrder(input.saleOrderId);
    if (!order) {
      throw new Error('Orden de venta no encontrada');
    }

    const existing = billingRepository.getInvoiceBySaleOrder(order.id);
    if (existing) {
      throw new Error(`La orden de venta ${order.folio} ya ha sido facturada con folio fiscal ${existing.uuid}`);
    }

    // Determinar forma de pago SAT
    const lastPayment = order.payments[order.payments.length - 1];
    const paymentFormSat = mapPaymentMethodToSat(lastPayment?.method ?? 'cash');

    // Timbrar mediante PAC (FacturAPI)
    const stampResult = await pacAdapter.stamp(order, input.taxProfile, paymentFormSat);

    const folio = `FAC-${(invoiceSequence++).toString().padStart(4, '0')}`;
    const now = new Date();
    const tax = Math.round(order.total * 0.16 * 100) / 100;
    const subtotal = Math.round((order.total - tax) * 100) / 100;

    const invoice: Invoice = {
      id: randomUUID(),
      saleOrderId: order.id,
      saleOrderFolio: order.folio,
      branchId: order.branchId,
      uuid: stampResult.uuid,
      folio,
      rfc: input.taxProfile.rfc.toUpperCase().trim(),
      legalName: input.taxProfile.legalName.toUpperCase().trim(),
      zipCode: input.taxProfile.zipCode.trim(),
      taxSystem: input.taxProfile.taxSystem,
      cfdiUse: input.taxProfile.cfdiUse ?? 'D07',
      paymentFormSat,
      subtotal,
      tax,
      total: order.total,
      status: 'issued',
      issuedAt: now,
      xmlContent: stampResult.xmlContent,
      pdfUrl: stampResult.pdfUrl,
      satVerificationUrl: stampResult.satVerificationUrl,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    billingRepository.saveInvoice(invoice);

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'create',
      entity: 'Invoice',
      entityId: invoice.id,
      requestId: actor.requestId,
      metadata: { folio: invoice.folio, uuid: invoice.uuid, rfc: invoice.rfc },
    });

    return invoice;
  }

  async getInvoice(
    invoiceId: InvoiceId,
    actor: ActorContext
  ): Promise<Invoice | null> {
    if (!authorize(actor.role, 'readInvoice', 'Invoice')) {
      throw new Error('Permission denied');
    }
    const inv = billingRepository.getInvoice(invoiceId);
    return inv ?? null;
  }

  async getInvoiceBySaleOrder(
    saleOrderId: string,
    actor: ActorContext
  ): Promise<Invoice | null> {
    if (!authorize(actor.role, 'readInvoice', 'Invoice')) {
      throw new Error('Permission denied');
    }
    const inv = billingRepository.getInvoiceBySaleOrder(saleOrderId);
    return inv ?? null;
  }

  async getXml(invoiceId: InvoiceId, actor: ActorContext): Promise<string> {
    if (!authorize(actor.role, 'readInvoice', 'Invoice')) {
      throw new Error('Permission denied');
    }
    const inv = billingRepository.getInvoice(invoiceId);
    if (!inv || !inv.xmlContent) throw new Error('Archivo XML no disponible');
    return inv.xmlContent;
  }

  async cancelInvoice(
    input: CancelInvoiceInput,
    actor: ActorContext
  ): Promise<Invoice> {
    if (!authorize(actor.role, 'cancelInvoice', 'Invoice')) {
      throw new Error('Permission denied: solo administradores pueden cancelar facturas ante el SAT');
    }

    const inv = billingRepository.getInvoice(input.invoiceId);
    if (!inv) throw new Error('Factura no encontrada');
    if (inv.status === 'cancelled') throw new Error('La factura ya está cancelada ante el SAT');

    await pacAdapter.cancel(inv.uuid, input.motive);

    inv.status = 'cancelled';
    inv.cancellationMotive = input.motive;
    inv.cancelledAt = new Date();
    inv.version = input.expectedVersion + 1;

    billingRepository.saveInvoice(inv);

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'update',
      entity: 'Invoice',
      entityId: inv.id,
      requestId: actor.requestId,
      reason: `Cancelación SAT motivo ${input.motive}`,
      metadata: { action: 'cancelInvoice', uuid: inv.uuid },
    });

    return inv;
  }
}
