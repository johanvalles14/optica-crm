import type {
  FullConsultation,
  NonClinicalNoteKey,
  SafeSummary,
} from '../../../contracts/clinical.contract';
import {
  assertNonClinicalNoteKey,
  getNonClinicalNoteLabel,
} from './non-clinical-notes';

export function buildSafeSummary(
  full: FullConsultation,
  patientInfo: { patientName: string; folio: string },
  noteKey?: NonClinicalNoteKey
): SafeSummary {
  const effectiveKey = noteKey ?? full.consultation.nonClinicalNoteKey;
  if (effectiveKey) {
    assertNonClinicalNoteKey(effectiveKey);
  }

  return {
    patientName: patientInfo.patientName,
    folio: patientInfo.folio,
    consultationDate: full.consultation.openedAt,
    usage: full.prescription?.usage,
    status: full.consultation.status,
    nonClinicalNoteKey: effectiveKey,
    nonClinicalNote: effectiveKey
      ? getNonClinicalNoteLabel(effectiveKey)
      : undefined,
  };
}
