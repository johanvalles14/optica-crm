export function generateFolio(branchCode: string, sequence: number): string {
  if (!branchCode || branchCode.length < 2 || branchCode.length > 3) {
    throw new Error('Branch code must be 2 or 3 characters');
  }
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error('Sequence must be a positive integer');
  }
  const suffixLength = 8 - branchCode.length;
  const suffix = sequence
    .toString(36)
    .toUpperCase()
    .padStart(suffixLength, '0')
    .slice(-suffixLength);
  return `${branchCode}${suffix}`;
}
