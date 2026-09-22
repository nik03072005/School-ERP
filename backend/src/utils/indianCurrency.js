const UNITS = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

export function numberToWordsIndian(amount) {
  const n = Math.floor(Number(amount || 0));
  if (n === 0) return "Rupees Zero Only";

  function convertChunk(num) {
    if (num === 0) return "";
    let str = "";
    if (Math.floor(num / 10000000) > 0) {
      str += convertChunk(Math.floor(num / 10000000)) + " Crore ";
      num %= 10000000;
    }
    if (Math.floor(num / 100000) > 0) {
      str += convertChunk(Math.floor(num / 100000)) + " Lakh ";
      num %= 100000;
    }
    if (Math.floor(num / 1000) > 0) {
      str += convertChunk(Math.floor(num / 1000)) + " Thousand ";
      num %= 1000;
    }
    if (Math.floor(num / 100) > 0) {
      str += convertChunk(Math.floor(num / 100)) + " Hundred ";
      num %= 100;
    }
    if (num > 0) {
      if (num < 20) {
        str += UNITS[num] + " ";
      } else {
        str += TENS[Math.floor(num / 10)] + " ";
        if (num % 10 > 0) str += UNITS[num % 10] + " ";
      }
    }
    return str.trim();
  }

  const words = convertChunk(n);
  return `Rupees ${words} Only`;
}

