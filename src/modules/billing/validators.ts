import type { PaymentMethod } from '../../../contracts/sales.contract';
import type { PaymentFormSat, TaxProfileInput } from '../../../contracts/billing.contract';

const RFC_REGEX = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i;
const ZIP_REGEX = /^[0-9]{5}$/;

export function validateTaxProfile(input: TaxProfileInput): void {
  if (!input.rfc || !RFC_REGEX.test(input.rfc.trim())) {
    throw new Error('RFC inválido: debe contener 12 caracteres (persona moral) o 13 caracteres (persona física) con formato oficial del SAT');
  }

  if (!input.legalName || !input.legalName.trim()) {
    throw new Error('El nombre o razón social fiscal es obligatorio');
  }

  if (!input.zipCode || !ZIP_REGEX.test(input.zipCode.trim())) {
    throw new Error('Código postal fiscal inválido: debe contener exactamente 5 dígitos numéricos');
  }

  if (!input.taxSystem) {
    throw new Error('El régimen fiscal del receptor es obligatorio');
  }
}

export function mapPaymentMethodToSat(method?: PaymentMethod): PaymentFormSat {
  switch (method) {
    case 'cash':
      return '01';
    case 'transfer':
      return '03';
    case 'card_credit':
      return '04';
    case 'card_debit':
      return '28';
    default:
      return '01';
  }
}
