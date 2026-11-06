export const toPaise = (amountInRupees) => {
  if (amountInRupees === null || amountInRupees === undefined || isNaN(amountInRupees)) {
    return 0;
  }
  return Math.round(Number(amountInRupees) * 100);
};

export const toRupees = (amountInPaise) => {
  if (!amountInPaise) return 0;
  return Number(amountInPaise) / 100;
};

export const formatINR = (amountInPaise, showSign = false) => {
  const rupees = toRupees(amountInPaise);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Math.abs(rupees));

  if (rupees < 0) {
    return `-${formatted}`;
  }
  if (showSign && rupees > 0) {
    return `+${formatted}`;
  }
  return formatted;
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};
