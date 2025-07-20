import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, minimumFractionDigits = 2) {
    if (typeof amount !== 'number') {
        return '$0.00';
    }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "symbol",
    minimumFractionDigits: minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const getTranslatedName = (nameField: any): string => {
  if (typeof nameField === 'string') {
    return nameField;
  }
  if (typeof nameField === 'object' && nameField !== null && !Array.isArray(nameField)) {
    return nameField.es_EC || nameField.en_US || 'N/A';
  }
  if (Array.isArray(nameField) && nameField.length > 1) {
    return getTranslatedName(nameField[1]);
  }
  return 'N/A';
};
