// Spójne formatowanie kwot w złotówkach: "1 234,56 zł" (format pl-PL).
const plnFormatter = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (value) => {
  const number = typeof value === 'number' ? value : parseFloat(value);
  if (value === null || value === undefined || Number.isNaN(number)) {
    return '—';
  }
  return plnFormatter.format(number);
};
