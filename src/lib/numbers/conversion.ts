export const NUMBER_MODES = ["numbers", "prices", "dates", "times"] as const;
export type NumberMode = typeof NUMBER_MODES[number];
export type NumberResult = {
  mode: NumberMode; value: string; hanzi: string; pinyin: string; written?: string;
  explanation: string; parts: { label: string; value: string; hanzi: string }[];
};
const digits = "零一二三四五六七八九";
const readings: Record<string, string> = {
  零:"líng",一:"yī",二:"èr",三:"sān",四:"sì",五:"wǔ",六:"liù",七:"qī",八:"bā",九:"jiǔ",
  十:"shí",百:"bǎi",千:"qiān",万:"wàn",亿:"yì",负:"fù",点:"diǎn",两:"liǎng",元:"yuán",角:"jiǎo",分:"fēn",块:"kuài",毛:"máo",
  年:"nián",月:"yuè",号:"hào",凌:"líng",晨:"chén",上:"shàng",午:"wǔ",中:"zhōng",下:"xià",晚:"wǎn",半:"bàn",整:"zhěng",刻:"kè",
};
export function numberPinyin(text: string) { return [...text].map(c => readings[c] ?? c).join(" "); }
export function digitChinese(value: string) { return [...value].map(c => digits[Number(c)]).join(""); }

function sectionChinese(value: number, omitOne: boolean) {
  let result = "", gap = false;
  for (const [unit, label] of [[1000,"千"],[100,"百"],[10,"十"],[1,""]] as const) {
    const digit = Math.floor(value / unit) % 10;
    if (digit) {
      if (gap) result += "零";
      result += (omitOne && !result && unit === 10 && digit === 1 ? "" : digits[digit]) + label;
      gap = false;
    } else if (result && value % unit) gap = true;
  }
  return result;
}
export function integerChinese(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0 || value > 999999999) throw new Error("Use a whole number from 0 to 999,999,999.");
  if (!value) return "零";
  let result = "", gap = false;
  for (const [unit, label] of [[100000000,"亿"],[10000,"万"],[1,""]] as const) {
    const section = Math.floor(value / unit) % 10000;
    if (section) {
      if (result && (gap || section < 1000)) result += "零";
      result += sectionChinese(section, !result) + label; gap = false;
    } else if (result && value % unit) gap = true;
  }
  return result;
}
export function financialChinese(text: string) {
  const ordinary = "零一二三四五六七八九十百千万亿";
  const formal = "零壹贰叁肆伍陆柒捌玖拾佰仟万亿";
  return [...text].map(c => ordinary.includes(c) ? formal[ordinary.indexOf(c)] : c).join("");
}
function asciiInput(value: string) { return value.normalize("NFKC").trim(); }
/** Exact string normalisation: never truncate a decimal or round a price. */
export function parseDecimal(input: string, maxDecimals = 4, maxWhole = 999999999, negative = true) {
  const value = asciiInput(input);
  const match = /^(-?)(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?$/.exec(value);
  if (!match) throw new Error("Enter digits with optional correctly grouped commas and a decimal point, for example 1,025.50.");
  if (match[1] && !negative) throw new Error("Prices cannot be negative.");
  const whole = match[2].replaceAll(",", "").replace(/^0+(?=\d)/, "");
  const fraction = match[3] || "";
  if (fraction.length > maxDecimals) throw new Error(`Use no more than ${maxDecimals} decimal places. Your value has not been rounded.`);
  if (whole.length > String(maxWhole).length || Number(whole) > maxWhole) throw new Error(`Use a value no larger than ${maxWhole.toLocaleString("en-US")}${maxDecimals === 2 ? ".99" : ""}.`);
  const sign = match[1] && (Number(whole) || /[1-9]/.test(fraction)) ? "-" : "";
  return { whole, fraction, negative: Boolean(sign), value: sign + whole + (fraction ? "." + fraction : "") };
}
export function canonicalDecimal(value: string): string {
  const parsed = parseDecimal(value);
  const fraction = parsed.fraction.replace(/0+$/, "");
  return (parsed.negative ? "-" : "") + parsed.whole + (fraction ? "." + fraction : "");
}

/** Deliberately accepts standard numeric Chinese, not ambiguous abbreviated prices. */
export function chineseToNumber(input: string) {
  const aliases: Record<string,string> = {壹:"一",贰:"二",貳:"二",叁:"三",叄:"三",參:"三",肆:"四",伍:"五",陆:"六",陸:"六",柒:"七",捌:"八",玖:"九",拾:"十",佰:"百",仟:"千",萬:"万",億:"亿",〇:"零",兩:"二",两:"二"};
  let text = [...asciiInput(input).replace(/\s/g, "")].map(c => aliases[c] ?? c).join("");
  const negative = text.startsWith("负"); if (negative) text = text.slice(1);
  if (!/^[零一二三四五六七八九十百千万亿]+(?:点[零一二三四五六七八九]{1,4})?$/.test(text)) throw new Error("Use standard Chinese number characters, for example 一万零一 or 二十五点五. Currency, dates and abbreviated speech are not parsed here.");
  const [whole, fraction = ""] = text.split("点");
  let total = 0, section = 0, digit = 0;
  for (const c of whole) {
    if (digits.includes(c)) digit = digits.indexOf(c);
    else if (c === "万" || c === "亿") { total += (section + digit) * (c === "万" ? 10000 : 100000000); section = 0; digit = 0; }
    else { section += (digit || 1) * (({十:10,百:100,千:1000} as Record<string,number>)[c] || 0); digit = 0; }
  }
  const value = total + section + digit;
  const numeric = (negative ? "-" : "") + value + (fraction ? "." + [...fraction].map(c => digits.indexOf(c)).join("") : "");
  parseDecimal(numeric);
  if (whole.replace(/^一十/, "十") !== integerChinese(value)) throw new Error("Use the full standard form, including 零 where needed. For example 一百零五 = 105; abbreviated forms such as 一百五 are ambiguous here.");
  return numeric;
}

export function convertNumber(input: string, reverse = false): NumberResult {
  const parsed = parseDecimal(reverse ? chineseToNumber(input) : input);
  const whole = integerChinese(Number(parsed.whole));
  const hanzi = (parsed.negative ? "负" : "") + whole + (parsed.fraction ? "点" + digitChinese(parsed.fraction) : "");
  const parts = [
    ...(Number(parsed.whole) >= 100000000 ? [{label:"Hundred millions", value:String(Math.floor(Number(parsed.whole) / 100000000)), hanzi:"亿"}] : []),
    ...(Number(parsed.whole) >= 10000 ? [{label:"Ten-thousands", value:String(Math.floor(Number(parsed.whole) / 10000) % 10000), hanzi:"万"}] : []),
    {label:"Remaining units", value:String(Number(parsed.whole) % 10000), hanzi:integerChinese(Number(parsed.whole) % 10000)},
    ...(parsed.fraction ? [{label:"After the point", value:parsed.fraction, hanzi:digitChinese(parsed.fraction)}] : []),
  ];
  return {mode:"numbers", value:parsed.value, hanzi, pinyin:numberPinyin(hanzi), written:financialChinese(hanzi), parts,
    explanation:parsed.fraction ? "Read the digits after 点 one by one. Trailing decimal zeros are retained in this reading." : "Chinese groups large numbers by 万 (10,000) and 亿 (100,000,000). Internal gaps are read with 零."};
}
function spokenInteger(value: number) {
  return integerChinese(value).replace(/(^|万|亿)二(?=[百千])|^二(?=万)/g, (_, prefix: string) => (prefix || "") + "两");
}
export function convertPrice(input: string): NumberResult {
  const parsed = parseDecimal(input, 2, 9999999, false);
  const cents = parsed.fraction.padEnd(2, "0");
  const yuan = Number(parsed.whole), jiao = Number(cents[0]), fen = Number(cents[1]);
  let hanzi = yuan ? (yuan === 2 ? "两" : spokenInteger(yuan)) + "块" : "";
  if (jiao) hanzi += digits[jiao] + "毛";
  if (fen) hanzi += (yuan && !jiao ? "零" : "") + digits[fen] + "分";
  if (!hanzi) hanzi = "零块";
  const written = integerChinese(yuan) + "元" + (jiao ? digits[jiao] + "角" : "") + (fen ? (yuan && !jiao ? "零" : "") + digits[fen] + "分" : "") + (!jiao && !fen ? "整" : "");
  return {mode:"prices", value:parsed.whole + "." + cents, hanzi, pinyin:numberPinyin(hanzi), written,
    explanation:"Prices here are in RMB. 块 and 毛 are everyday spoken units; 元 and 角 are written units. 1 元 = 10 角 = 100 分. No currency exchange is performed.",
    parts:[{label:"Yuan",value:parsed.whole,hanzi:"元 / 块"},{label:"Jiao",value:String(jiao),hanzi:"角 / 毛"},{label:"Fen",value:String(fen),hanzi:"分"}]};
}
export function parseCalendar(input: string) {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(asciiInput(input));
  if (!match) throw new Error("Choose a full date, or use YYYY-MM-DD, for example 2026-11-05.");
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  if (year < 1900 || year > 2100 || month < 1 || month > 12) throw new Error("Choose a Gregorian date between 1900 and 2100.");
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const limit = [31,leap ? 29 : 28,31,30,31,30,31,31,30,31,30,31][month - 1];
  if (day < 1 || day > limit) throw new Error("That date does not exist. Check the day and leap year.");
  return {year,month,day,value:`${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`};
}
export function convertDate(input: string): NumberResult {
  const {year,month,day,value} = parseCalendar(input);
  const parts = [{label:"Year · digit by digit",value:String(year),hanzi:digitChinese(String(year)) + "年"},{label:"Month",value:String(month),hanzi:integerChinese(month) + "月"},{label:"Day",value:String(day),hanzi:integerChinese(day) + "号"}];
  const hanzi = parts.map(p => p.hanzi).join("");
  return {mode:"dates",value,hanzi,pinyin:numberPinyin(hanzi),written:hanzi.replace(/号$/, "日"),parts,explanation:"Use year → month → day. Read the year digit by digit, but read the month and day as numbers. 号 is common in speech; 日 is used in written dates."};
}
export function parseClock(input: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(asciiInput(input));
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) throw new Error("Use a 24-hour time from 00:00 to 23:59. Use 00:00 for midnight, not 24:00.");
  return {hour:Number(match[1]),minute:Number(match[2]),value:match[1].padStart(2,"0") + ":" + match[2]};
}
export function convertTime(input: string): NumberResult {
  const {hour,minute,value} = parseClock(input);
  const period = hour < 6 ? "凌晨" : hour < 12 ? "上午" : hour === 12 ? "中午" : hour < 18 ? "下午" : "晚上";
  const h = hour > 12 ? hour - 12 : hour;
  const hourText = (h === 2 ? "两" : integerChinese(h)) + "点";
  const minuteText = !minute ? "整" : (minute < 10 ? "零" : "") + integerChinese(minute) + "分";
  const spokenMinute = minute === 30 ? "半" : minute === 15 ? "一刻" : minuteText;
  const hanzi = period + hourText + spokenMinute;
  return {mode:"times",value,hanzi,pinyin:numberPinyin(hanzi),written:period + hourText + minuteText,
    explanation:"The input uses a 24-hour clock. The spoken reading includes the part of the day: 两点 for two o’clock, 半 for thirty minutes and 一刻 for fifteen minutes. This is a clock reading, not a timezone conversion.",
    parts:[{label:"Part of the day",value:hour < 12 ? "AM" : "PM",hanzi:period},{label:"Hour",value:String(hour).padStart(2,"0"),hanzi:hourText},{label:"Minutes",value:String(minute).padStart(2,"0"),hanzi:spokenMinute}]};
}
export function convert(mode: NumberMode, input: string, reverse = false): NumberResult {
  return mode === "numbers" ? convertNumber(input,reverse) : mode === "prices" ? convertPrice(input) : mode === "dates" ? convertDate(input) : convertTime(input);
}
export function normalizeAnswer(mode: NumberMode, input: string): string | undefined {
  try {
    const text = asciiInput(input);
    if (mode === "dates") return parseCalendar(text.replaceAll("/", "-")).value;
    if (mode === "times") return parseClock(text).value;
    const value = text.replaceAll(" ", "");
    return mode === "prices" ? canonicalDecimal(convertPrice(value).value) : canonicalDecimal(value);
  } catch { return undefined; }
}
