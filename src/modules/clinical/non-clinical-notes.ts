import type {
  NonClinicalNote,
  NonClinicalNoteKey,
} from '../../../contracts/clinical.contract';

const catalog: Record<NonClinicalNoteKey, NonClinicalNote> = {
  follow_up: 'Paciente solicita cita de seguimiento',
  external_rx: 'Paciente trae receta externa',
  contact_later: 'Requiere contacto posterior',
  prefer_phone: 'Preferencia de contacto por teléfono',
  prefer_email: 'Preferencia de contacto por correo',
};

export function getNonClinicalNoteLabel(
  key: NonClinicalNoteKey
): NonClinicalNote {
  return catalog[key];
}

export function isNonClinicalNoteKey(
  value: unknown
): value is NonClinicalNoteKey {
  return typeof value === 'string' && value in catalog;
}

export function assertNonClinicalNoteKey(
  value: unknown
): asserts value is NonClinicalNoteKey {
  if (!isNonClinicalNoteKey(value)) {
    throw new Error('Invalid non-clinical note key: must be from closed catalog');
  }
}

export function listNonClinicalNotes(): Array<{
  key: NonClinicalNoteKey;
  label: NonClinicalNote;
}> {
  return Object.entries(catalog).map(([key, label]) => ({
    key: key as NonClinicalNoteKey,
    label,
  }));
}
