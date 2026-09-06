import type { RefractionValue, LensUsage, NonClinicalNoteKey } from '../../contracts/clinical.contract';

export const validRightEye: RefractionValue = {
  eye: 'OD',
  sphere: -2.5,
  cylinder: -0.75,
  axis: 180,
  addition: 0,
  visualAcuity: '20/20',
  visualAcuityDecimal: 1.0,
  pupillaryDistance: 62,
};

export const validLeftEye: RefractionValue = {
  eye: 'OI',
  sphere: -2.25,
  cylinder: -0.5,
  axis: 175,
  addition: 0,
  visualAcuity: '20/20',
  visualAcuityDecimal: 1.0,
  pupillaryDistance: 62,
};

export const neutralEye = (eye: 'OD' | 'OI'): RefractionValue => ({
  eye,
  sphere: 0,
  cylinder: 0,
  axis: 0,
  addition: 0,
  visualAcuity: '20/20',
  visualAcuityDecimal: 1.0,
  pupillaryDistance: 62,
});

export const invalidPositiveCylinder: RefractionValue = {
  eye: 'OD',
  sphere: -2,
  cylinder: 0.75,
  axis: 90,
};

export const missingAxisWithCylinder: RefractionValue = {
  eye: 'OD',
  sphere: -2,
  cylinder: -0.75,
};

export const sphereOutOfRange: RefractionValue = {
  eye: 'OD',
  sphere: 31,
  cylinder: 0,
  axis: 0,
};

export const cylinderOutOfRange: RefractionValue = {
  eye: 'OD',
  sphere: -2,
  cylinder: -10.25,
  axis: 90,
};

export const axisOutOfRange: RefractionValue = {
  eye: 'OD',
  sphere: -2,
  cylinder: -0.75,
  axis: 181,
};

export const additionOutOfRange: RefractionValue = {
  eye: 'OD',
  sphere: -2,
  cylinder: 0,
  axis: 0,
  addition: 5.25,
};

export const pupillaryDistanceOutOfRange: RefractionValue = {
  eye: 'OD',
  sphere: -2,
  cylinder: 0,
  axis: 0,
  pupillaryDistance: 85,
};

export const invalidVisualAcuityFormat: RefractionValue = {
  eye: 'OD',
  sphere: -2,
  cylinder: 0,
  axis: 0,
  visualAcuity: 'invalid',
  visualAcuityDecimal: 99,
};

export const validUsage: LensUsage = 'progresivo';

export const validNonClinicalNoteKey: NonClinicalNoteKey = 'follow_up';
