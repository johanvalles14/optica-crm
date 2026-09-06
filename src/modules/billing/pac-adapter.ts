import { randomUUID } from 'node:crypto';
import type { Invoice, PaymentFormSat, TaxProfileInput } from '../../../contracts/billing.contract';
import type { SaleOrder } from '../../../contracts/sales.contract';

export interface PacStampResult {
  uuid: string;
  xmlContent: string;
  satVerificationUrl: string;
  pdfUrl: string;
}

export class PacFacturApiAdapter {
  async stamp(order: SaleOrder, profile: TaxProfileInput, paymentFormSat: PaymentFormSat): Promise<PacStampResult> {
    const uuid = randomUUID();
    const now = new Date().toISOString();
    const emisorRfc = 'OPT180420AA1';
    const emisorNombre = 'OPTICA LAGUNA CENTRAL';

    // Generar XML CFDI 4.0 válido simulado
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Version="4.0" Fecha="${now}" FormaPago="${paymentFormSat}" MetodoPago="PUE" Moneda="MXN" SubTotal="${order.subtotal}" Total="${order.total}" TipoDeComprobante="I" LugarExpedicion="27000" Exportacion="01">
  <cfdi:Emisor Rfc="${emisorRfc}" Nombre="${emisorNombre}" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="${profile.rfc.toUpperCase()}" Nombre="${profile.legalName.toUpperCase()}" DomicilioFiscalReceptor="${profile.zipCode}" RegimenFiscalReceptor="${profile.taxSystem}" UsoCFDI="${profile.cfdiUse || 'D07'}"/>
  <cfdi:Conceptos>
${order.items.map((item) => `    <cfdi:Concepto ClaveProdServ="42142900" NoIdentificacion="OPT-ITEM" Cantidad="${item.quantity}" ClaveUnidad="H87" Unidad="Pieza" Descripcion="${item.description}" ValorUnitario="${item.unitPrice}" Importe="${item.totalPrice}" ObjetoImp="02">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado Base="${item.totalPrice}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${(item.totalPrice * 0.16).toFixed(2)}"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>`).join('\n')}
  </cfdi:Conceptos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" Version="1.1" UUID="${uuid}" FechaTimbrado="${now}" RfcProvCertif="FAC130626CP7" SelloCFD="dGltYnJhZG9fZGVtb19zZWxsbw==" NoCertificadoSAT="00001000000504465028" SelloSAT="c2VsbG9fc2F0X2ZpY3RpY2lv"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

    const satVerificationUrl = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${uuid}&re=${emisorRfc}&rr=${profile.rfc}&tt=${order.total}`;
    const pdfUrl = `/api/billing/invoices/${uuid}/pdf`;

    return {
      uuid,
      xmlContent,
      satVerificationUrl,
      pdfUrl,
    };
  }

  async cancel(uuid: string, motive: string): Promise<boolean> {
    // Simula cancelación exitosa con el PAC
    return true;
  }
}

export const pacAdapter = new PacFacturApiAdapter();
