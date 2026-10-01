// Монгол латин (Narnii khoroolol) → кирилл. OSM дээрх нэр ихэвчлэн кирилл тул хайлтын хувилбар үүсгэнэ.
const DIGRAPHS: [string, string][] = [
  ["shch", "щ"],
  ["kh", "х"],
  ["ts", "ц"],
  ["ch", "ч"],
  ["sh", "ш"],
  ["yo", "ё"],
  ["yu", "ю"],
  ["ya", "я"],
  ["ye", "е"],
  ["oo", "оо"],
  ["uu", "уу"],
  ["o'", "ө"],
  ["u'", "ү"],
  ["ö", "ө"],
  ["ü", "ү"],
];

const LETTERS: Record<string, string> = {
  a: "а",
  b: "б",
  c: "ц",
  d: "д",
  e: "э",
  f: "ф",
  g: "г",
  h: "х",
  i: "и",
  j: "ж",
  k: "к",
  l: "л",
  m: "м",
  n: "н",
  o: "о",
  p: "п",
  q: "к",
  r: "р",
  s: "с",
  t: "т",
  u: "у",
  v: "в",
  w: "в",
  x: "х",
  y: "ы",
  z: "з",
};

function latinToCyrillic(input: string, ii: "ий" | "ы") {
  let text = input.toLowerCase().replaceAll("ii", ii);
  for (const [from, to] of DIGRAPHS) text = text.replaceAll(from, to);
  return [...text].map((char) => LETTERS[char] ?? char).join("");
}

export function normalizePlaceName(value: string) {
  return value
    .toLowerCase()
    .replace(/[.,'"’\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Эх бичвэр + латин бол кирилл хувилбарууд. "ii" нь ий ба ы хоёуланг нь оролдоно (нийслэл / нарны).
export function geocodeQueries(raw: string) {
  const query = raw.trim();
  const queries = [query];
  if (!/[a-z]/i.test(query)) return queries;
  for (const variant of [latinToCyrillic(query, "ы"), latinToCyrillic(query, "ий")]) {
    if (variant && !queries.some((item) => normalizePlaceName(item) === normalizePlaceName(variant))) {
      queries.push(variant);
    }
  }
  return queries.slice(0, 3);
}
