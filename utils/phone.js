import { getDialCodeByIso2 } from "@/utils/countryCallingCodes";

export const OTP_SUPPORTED_COUNTRIES = ["US", "CA", "GB", "AU"]; // start simple; can expand later

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeNationalDigitsForCountry(digits, iso2) {
  const country = String(iso2 || "").toUpperCase();
  let d = String(digits || "");

  // Common: users type leading 0 locally (esp UK)
  if (d.startsWith("0") && country !== "US" && country !== "CA") {
    d = d.replace(/^0+/, "");
  }

  // NANP: allow 11 digits starting with 1
  if (
    (country === "US" || country === "CA") &&
    d.length === 11 &&
    d.startsWith("1")
  ) {
    d = d.slice(1);
  }

  return d;
}

export function normalizePhoneForApi(input, countryIso2) {
  const raw = String(input || "").trim();
  if (!raw) return "";

  // If user already gave +, trust it as E.164-ish
  if (raw.startsWith("+")) {
    const digits = digitsOnly(raw);
    return digits ? `+${digits}` : "";
  }

  // Legacy behavior (no country selected)
  if (!countryIso2) {
    const digits = digitsOnly(raw);
    if (!digits) return "";

    if (digits.length === 10) {
      return `+1${digits}`;
    }

    if (digits.length === 11 && digits.startsWith("1")) {
      return `+${digits}`;
    }

    // leave it as-is; backend will validate and show friendly error
    return raw;
  }

  // Country-aware behavior
  const dialCode = getDialCodeByIso2(countryIso2);
  const digits = digitsOnly(raw);
  if (!dialCode || !digits) return "";

  const national = normalizeNationalDigitsForCountry(digits, countryIso2);
  if (!national) return "";

  // Basic length checks for US/CA (10 digits after normalization)
  const country = String(countryIso2 || "").toUpperCase();
  if ((country === "US" || country === "CA") && national.length !== 10) {
    return "";
  }

  return `+${dialCode}${national}`;
}
