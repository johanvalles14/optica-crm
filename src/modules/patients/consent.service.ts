import { patientRepository } from './repository';

export interface HasValidConsentOptions {
  currentNoticeId: string;
  blockClinicalWrite?: boolean;
}

export async function hasValidConsent(
  patientId: string,
  options: HasValidConsentOptions
): Promise<boolean> {
  const consent = patientRepository.getValidConsent(patientId);
  const valid = Boolean(
    consent && consent.noticeId === options.currentNoticeId
  );

  if (options.blockClinicalWrite && !valid) {
    throw new Error(
      'Valid consent is required for clinical write operations. Re-consent may be needed.'
    );
  }

  return valid;
}
