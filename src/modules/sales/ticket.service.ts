import type { SaleOrder, TicketPrintData } from '../../../contracts/sales.contract';

export function formatTicketData(order: SaleOrder, branchName = 'Óptica Central'): TicketPrintData {
  return {
    orderFolio: order.folio,
    branchName,
    date: order.createdAt,
    patientName: order.patientName,
    items: order.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      total: i.totalPrice,
    })),
    total: order.total,
    paidAmount: order.paidAmount,
    balanceDue: order.balanceDue,
    payments: order.payments.map((p) => ({
      method: p.method === 'cash' ? 'Efectivo' : p.method === 'transfer' ? 'Transferencia' : 'Tarjeta',
      amount: p.amount,
      date: p.paidAt,
    })),
    promisedDeliveryDate: order.promisedDeliveryDate,
    policiesText:
      'Garantía de 30 días en graduación y armazón por defecto de fábrica. Para recoger sus lentes terminados es indispensable liquidar el saldo total y presentar este comprobante.',
  };
}
