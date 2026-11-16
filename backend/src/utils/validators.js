/**
 * Validation utilities for incoming HTTP requests
 */

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isPositiveInt(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

function isValidRating(value) {
  const num = Number(value);
  return Number.isInteger(num) && num >= 1 && num <= 5;
}

function isValidEnum(value, allowedValues) {
  return typeof value === 'string' && allowedValues.includes(value.toUpperCase());
}

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidUrl,
  isPositiveInt,
  isValidRating,
  isValidEnum
};
