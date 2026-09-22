const UNITS = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

export function numberToWords(amount) {
  const n = Math.floor(Number(amount || 0));
  if (n === 0) return "Rupees Zero Only";
  function chunk(num) {
    if (num === 0) return "";
    let s = "";
    if (Math.floor(num / 10000000) > 0) { s += chunk(Math.floor(num / 10000000)) + " Crore "; num %= 10000000; }
    if (Math.floor(num / 100000) > 0)   { s += chunk(Math.floor(num / 100000))   + " Lakh ";  num %= 100000;   }
    if (Math.floor(num / 1000) > 0)     { s += chunk(Math.floor(num / 1000))     + " Thousand "; num %= 1000;  }
    if (Math.floor(num / 100) > 0)      { s += chunk(Math.floor(num / 100))      + " Hundred ";  num %= 100;   }
    if (num > 0) {
      if (num < 20) s += UNITS[num] + " ";
      else { s += TENS[Math.floor(num / 10)] + " "; if (num % 10 > 0) s += UNITS[num % 10] + " "; }
    }
    return s.trim();
  }
  return `Rupees ${chunk(n)} Only`;
}

export const currency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

