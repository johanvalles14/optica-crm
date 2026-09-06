import type { RefractionValue } from '../../../contracts/clinical.contract';

function isQuarterStep(value: number): boolean {
  const scaled = Math.round(value * 100);
  return scaled % 25 === 0;
}

function isValidVisualAcuity(value: string): boolean {
  if (/^20\/\d+$/.test(value)) return true;
  if (/^\d+\/\d+$/.test(value)) return true;
  const decimal = Number.parseFloat(value);
  if (!Number.isNaN(decimal) && decimal >= 0.1 && decimal <= 1.2) return true;
  return false;
}

export function validateRefraction(value: RefractionValue): void {
  if (value.sphere !== undefined) {
    if (value.sphere < -30.0 || value.sphere > 30.0) {
      throw new Error('sphere out of range: must be between -30.00 and +30.00 D');
    }
    if (!isQuarterStep(value.sphere)) {
      throw new Error('sphere resolution must be 0.25 D');
    }
  }

  if (value.cylinder !== undefined) {
    if (value.cylinder > 0) {
      throw new Error('cylinder must be negative or zero');
    }
    if (value.cylinder < -10.0) {
      throw new Error('cylinder out of range: must be between 0.00 and -10.00 D');
    }
    if (!isQuarterStep(value.cylinder)) {
      throw new Error('cylinder resolution must be 0.25 D');
    }
    if (value.cylinder !== 0 && value.axis === undefined) {
      throw new Error('axis is required when cylinder is non-zero');
    }
  }

  if (value.axis !== undefined) {
    if (value.axis < 0 || value.axis > 180) {
      throw new Error('axis out of range: must be between 0° and 180°');
    }
  }

  if (value.addition !== undefined) {
    if (value.addition < 0.0 || value.addition > 5.0) {
      throw new Error('addition out of range: must be between 0.00 and +5.00 D');
    }
    if (!isQuarterStep(value.addition)) {
      throw new Error('addition resolution must be 0.25 D');
    }
  }

  if (value.pupillaryDistance !== undefined) {
    if (value.pupillaryDistance < 30 || value.pupillaryDistance > 80) {
      throw new Error('pupillary distance out of range: must be between 30 mm and 80 mm');
    }
  }

  if (value.visualAcuity !== undefined) {
    if (!isValidVisualAcuity(value.visualAcuity)) {
      throw new Error('visual acuity format not recognized');
    }
  }
}
