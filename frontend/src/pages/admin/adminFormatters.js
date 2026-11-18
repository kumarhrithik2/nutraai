export function formatMoney(value, currency = 'INR') {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
}

export function formatDate(value) {
  if (!value) return '-'
  try { return new Date(value).toLocaleString() } catch { return String(value) }
}
