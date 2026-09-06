import type { PrivacyNotice } from '../../contracts/patients.contract';

export const privacyNoticeV1: PrivacyNotice = {
  id: 'notice-v1-2026',
  version: '1.0.0',
  contentHash: 'sha256:a1b2c3d4e5f6...',
  effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
};

export const privacyNoticeV2: PrivacyNotice = {
  id: 'notice-v2-2026',
  version: '1.1.0',
  contentHash: 'sha256:f6e5d4c3b2a1...',
  effectiveDate: new Date('2026-06-01T00:00:00.000Z'),
};
