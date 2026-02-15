// Minimal, dependency-free country calling code list for a picker.
// Source inspiration: ITU E.164 country calling codes (common public datasets).
// Note: This list is intended for UI selection and basic formatting only.

export const COUNTRY_CALLING_CODES = [
  { iso2: "US", name: "United States", dialCode: "1" },
  { iso2: "CA", name: "Canada", dialCode: "1" },
  { iso2: "GB", name: "United Kingdom", dialCode: "44" },
  { iso2: "AU", name: "Australia", dialCode: "61" },
  { iso2: "NZ", name: "New Zealand", dialCode: "64" },
  { iso2: "IE", name: "Ireland", dialCode: "353" },
  { iso2: "FR", name: "France", dialCode: "33" },
  { iso2: "DE", name: "Germany", dialCode: "49" },
  { iso2: "ES", name: "Spain", dialCode: "34" },
  { iso2: "IT", name: "Italy", dialCode: "39" },
  { iso2: "NL", name: "Netherlands", dialCode: "31" },
  { iso2: "BE", name: "Belgium", dialCode: "32" },
  { iso2: "CH", name: "Switzerland", dialCode: "41" },
  { iso2: "AT", name: "Austria", dialCode: "43" },
  { iso2: "SE", name: "Sweden", dialCode: "46" },
  { iso2: "NO", name: "Norway", dialCode: "47" },
  { iso2: "DK", name: "Denmark", dialCode: "45" },
  { iso2: "FI", name: "Finland", dialCode: "358" },
  { iso2: "PT", name: "Portugal", dialCode: "351" },
  { iso2: "GR", name: "Greece", dialCode: "30" },
  { iso2: "PL", name: "Poland", dialCode: "48" },
  { iso2: "CZ", name: "Czechia", dialCode: "420" },
  { iso2: "HU", name: "Hungary", dialCode: "36" },
  { iso2: "RO", name: "Romania", dialCode: "40" },
  { iso2: "BG", name: "Bulgaria", dialCode: "359" },
  { iso2: "UA", name: "Ukraine", dialCode: "380" },
  { iso2: "TR", name: "Turkey", dialCode: "90" },
  { iso2: "IL", name: "Israel", dialCode: "972" },
  { iso2: "AE", name: "United Arab Emirates", dialCode: "971" },
  { iso2: "SA", name: "Saudi Arabia", dialCode: "966" },
  { iso2: "QA", name: "Qatar", dialCode: "974" },
  { iso2: "KW", name: "Kuwait", dialCode: "965" },
  { iso2: "OM", name: "Oman", dialCode: "968" },
  { iso2: "BH", name: "Bahrain", dialCode: "973" },
  { iso2: "EG", name: "Egypt", dialCode: "20" },
  { iso2: "ZA", name: "South Africa", dialCode: "27" },
  { iso2: "NG", name: "Nigeria", dialCode: "234" },
  { iso2: "KE", name: "Kenya", dialCode: "254" },
  { iso2: "GH", name: "Ghana", dialCode: "233" },
  { iso2: "UG", name: "Uganda", dialCode: "256" },
  { iso2: "TZ", name: "Tanzania", dialCode: "255" },
  { iso2: "ET", name: "Ethiopia", dialCode: "251" },
  { iso2: "MA", name: "Morocco", dialCode: "212" },
  { iso2: "TN", name: "Tunisia", dialCode: "216" },
  { iso2: "DZ", name: "Algeria", dialCode: "213" },
  { iso2: "SN", name: "Senegal", dialCode: "221" },
  { iso2: "CI", name: "Côte d’Ivoire", dialCode: "225" },
  { iso2: "CM", name: "Cameroon", dialCode: "237" },
  { iso2: "MG", name: "Madagascar", dialCode: "261" },
  { iso2: "MU", name: "Mauritius", dialCode: "230" },
  { iso2: "IN", name: "India", dialCode: "91" },
  { iso2: "PK", name: "Pakistan", dialCode: "92" },
  { iso2: "BD", name: "Bangladesh", dialCode: "880" },
  { iso2: "LK", name: "Sri Lanka", dialCode: "94" },
  { iso2: "NP", name: "Nepal", dialCode: "977" },
  { iso2: "CN", name: "China", dialCode: "86" },
  { iso2: "HK", name: "Hong Kong", dialCode: "852" },
  { iso2: "TW", name: "Taiwan", dialCode: "886" },
  { iso2: "JP", name: "Japan", dialCode: "81" },
  { iso2: "KR", name: "South Korea", dialCode: "82" },
  { iso2: "SG", name: "Singapore", dialCode: "65" },
  { iso2: "MY", name: "Malaysia", dialCode: "60" },
  { iso2: "TH", name: "Thailand", dialCode: "66" },
  { iso2: "VN", name: "Vietnam", dialCode: "84" },
  { iso2: "PH", name: "Philippines", dialCode: "63" },
  { iso2: "ID", name: "Indonesia", dialCode: "62" },
  { iso2: "MM", name: "Myanmar", dialCode: "95" },
  { iso2: "KH", name: "Cambodia", dialCode: "855" },
  { iso2: "LA", name: "Laos", dialCode: "856" },
  { iso2: "MN", name: "Mongolia", dialCode: "976" },
  { iso2: "KZ", name: "Kazakhstan", dialCode: "7" },
  { iso2: "RU", name: "Russia", dialCode: "7" },
  { iso2: "BR", name: "Brazil", dialCode: "55" },
  { iso2: "AR", name: "Argentina", dialCode: "54" },
  { iso2: "CL", name: "Chile", dialCode: "56" },
  { iso2: "CO", name: "Colombia", dialCode: "57" },
  { iso2: "PE", name: "Peru", dialCode: "51" },
  { iso2: "VE", name: "Venezuela", dialCode: "58" },
  { iso2: "MX", name: "Mexico", dialCode: "52" },
  { iso2: "CR", name: "Costa Rica", dialCode: "506" },
  { iso2: "PA", name: "Panama", dialCode: "507" },
  { iso2: "GT", name: "Guatemala", dialCode: "502" },
  { iso2: "DO", name: "Dominican Republic", dialCode: "1" },
  { iso2: "JM", name: "Jamaica", dialCode: "1" },
  { iso2: "TT", name: "Trinidad and Tobago", dialCode: "1" },
  { iso2: "BB", name: "Barbados", dialCode: "1" },
  { iso2: "BS", name: "Bahamas", dialCode: "1" },
  { iso2: "PR", name: "Puerto Rico", dialCode: "1" },
  { iso2: "IS", name: "Iceland", dialCode: "354" },
  { iso2: "LU", name: "Luxembourg", dialCode: "352" },
  { iso2: "EE", name: "Estonia", dialCode: "372" },
  { iso2: "LV", name: "Latvia", dialCode: "371" },
  { iso2: "LT", name: "Lithuania", dialCode: "370" },
  { iso2: "SI", name: "Slovenia", dialCode: "386" },
  { iso2: "SK", name: "Slovakia", dialCode: "421" },
  { iso2: "HR", name: "Croatia", dialCode: "385" },
  { iso2: "RS", name: "Serbia", dialCode: "381" },
  { iso2: "BA", name: "Bosnia and Herzegovina", dialCode: "387" },
  { iso2: "ME", name: "Montenegro", dialCode: "382" },
  { iso2: "AL", name: "Albania", dialCode: "355" },
  { iso2: "MK", name: "North Macedonia", dialCode: "389" },
  { iso2: "CY", name: "Cyprus", dialCode: "357" },
  { iso2: "MT", name: "Malta", dialCode: "356" },
  { iso2: "LT", name: "Lithuania", dialCode: "370" },
  { iso2: "MD", name: "Moldova", dialCode: "373" },
  { iso2: "GE", name: "Georgia", dialCode: "995" },
  { iso2: "AM", name: "Armenia", dialCode: "374" },
  { iso2: "AZ", name: "Azerbaijan", dialCode: "994" },
  { iso2: "IR", name: "Iran", dialCode: "98" },
  { iso2: "IQ", name: "Iraq", dialCode: "964" },
  { iso2: "JO", name: "Jordan", dialCode: "962" },
  { iso2: "LB", name: "Lebanon", dialCode: "961" },
  { iso2: "SY", name: "Syria", dialCode: "963" },
  { iso2: "YE", name: "Yemen", dialCode: "967" },
  { iso2: "AF", name: "Afghanistan", dialCode: "93" },
  { iso2: "VN", name: "Vietnam", dialCode: "84" },
  { iso2: "UA", name: "Ukraine", dialCode: "380" },
  { iso2: "BY", name: "Belarus", dialCode: "375" },
  { iso2: "SE", name: "Sweden", dialCode: "46" },
  { iso2: "BR", name: "Brazil", dialCode: "55" },
  // Note: This list intentionally includes a broad set of common countries.
  // If you want the full exhaustive list, we can expand it further.
];

export function iso2ToFlagEmoji(iso2) {
  const key = String(iso2 || "").toUpperCase();
  if (key.length !== 2) return "🏳️";

  const A = 65;
  const base = 0x1f1e6; // Regional indicator symbol letter A

  const c1 = key.charCodeAt(0);
  const c2 = key.charCodeAt(1);

  if (c1 < A || c1 > 90 || c2 < A || c2 > 90) return "🏳️";

  return String.fromCodePoint(base + (c1 - A), base + (c2 - A));
}

export function getCountryByIso2(iso2) {
  const key = String(iso2 || "").toUpperCase();
  const found = COUNTRY_CALLING_CODES.find((c) => c.iso2 === key);
  return found || COUNTRY_CALLING_CODES[0];
}

export function getDialCodeByIso2(iso2) {
  const c = getCountryByIso2(iso2);
  return c?.dialCode || null;
}
