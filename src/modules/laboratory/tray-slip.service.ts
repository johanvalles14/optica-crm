import type { LabOrder, TraySlipData } from '../../../contracts/laboratory.contract';

export function formatTraySlip(order: LabOrder): TraySlipData {
  const mountingLabels = {
    full_rim: 'Aro Completo',
    semi_rimless_groove: 'Ranurado con Nylor / Hilo',
    rimless_drill: 'Al Aire (Tres Piezas / Perforado)',
  };

  const destinationLabels = {
    internal_workshop: 'Taller Propio en Local',
    external_lab: `Maquila Externa: ${order.externalLabName || 'Laboratorio'} ${
      order.externalGuideNumber ? `(Guía: ${order.externalGuideNumber})` : ''
    }`,
  };

  return {
    labOrderFolio: order.folio,
    saleOrderFolio: order.saleOrderFolio,
    patientName: order.patientName,
    date: order.createdAt,
    frameCode: order.frameCode,
    frameMountingType: mountingLabels[order.frameMountingType] ?? order.frameMountingType,
    lensMaterial: order.lensMaterial,
    treatmentsText: order.treatments.length > 0 ? order.treatments.join(' + ') : 'Sin tratamientos',
    rightEye: order.rightEye,
    leftEye: order.leftEye,
    destinationText: destinationLabels[order.destination] ?? order.destination,
    observations: order.observations,
  };
}
