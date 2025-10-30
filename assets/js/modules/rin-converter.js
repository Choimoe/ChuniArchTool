export const FULL_CHAIN_MAP = {
  0: "",
  1: "fullchain",
  2: "fullchain2",
  3: "fullchain3",
  4: "fullchain4",
};

export const REV_RANK_MAP = {
  0: "d",
  1: "c",
  2: "b",
  3: "bb",
  4: "bbb",
  5: "a",
  6: "aa",
  7: "aaa",
  8: "s",
  9: "sp",
  10: "ss",
  11: "ssp",
  12: "sss",
  13: "sssp",
};

export const RANK_MAP = {
  d: 0,
  c: 1,
  b: 2,
  bb: 3,
  bbb: 4,
  a: 5,
  aa: 6,
  aaa: 7,
  s: 8,
  sp: 9,
  ss: 10,
  ssp: 11,
  sss: 12,
  sssp: 13,
};

export function calculateScore(
  totalNotes,
  judgeHeaven,
  judgeCritical,
  judgeJustice,
  judgeAttack,
  judgeGuilty
) {
  const criticalScore = 1010000 / totalNotes;
  const justiceScore = criticalScore * (100 / 101);
  const attackScore = criticalScore * (50 / 101);

  return Math.floor(
    (judgeHeaven + judgeCritical) * criticalScore +
      judgeJustice * justiceScore +
      judgeAttack * attackScore
  );
}

export function calculateRank(score) {
  if (score >= 1009000) return "sssp";
  if (score >= 1007500) return "sss";
  if (score >= 1005000) return "ssp";
  if (score >= 1000000) return "ss";
  if (score >= 990000) return "sp";
  if (score >= 975000) return "s";
  if (score >= 950000) return "aaa";
  if (score >= 925000) return "aa";
  if (score >= 900000) return "a";
  if (score >= 800000) return "bbb";
  if (score >= 700000) return "bb";
  if (score >= 600000) return "b";
  if (score >= 500000) return "c";
  return "d";
}

export const CSV_HEADER = [
  "id",
  "song_name",
  "level",
  "level_index",
  "score",
  "rating",
  "over_power",
  "clear",
  "full_combo",
  "full_chain",
  "rank",
  "upload_time",
  "play_time",
];

export function convertRinToLx(jsonData) {
  if (!jsonData || !Array.isArray(jsonData.userPlaylogList)) {
    throw new Error("无效的 JSON 格式：未找到 'userPlaylogList' 数组。");
  }

  const csvRows = [];

  for (const log of jsonData.userPlaylogList) {
    const A = log.judgeGuilty || 0;
    const B = log.judgeAttack || 0;
    const C = log.judgeJustice || 0;
    const total = A + B + C;

    let clear = "failed";
    if (total < 10) clear = "catastrophe";
    else if (total < 50) clear = "absolute";
    else if (total < 150) clear = "brave";
    else if (total < 300 || A < 20) clear = "hard";
    else if (log.isClear) clear = "clear";

    let full_combo = "";
    if (log.score === 1010000) full_combo = "alljusticecritical";
    else if (log.isAllJustice) full_combo = "alljustice";
    else if (log.isFullCombo) full_combo = "fullcombo";

    const full_chain = FULL_CHAIN_MAP[log.fullChainKind] || "";
    const rank_str = REV_RANK_MAP[log.rank] || "";

    const upload_time = (log.userPlayDate || "").replace("T", " ");
    const play_time = (log.userPlayDate || "").replace("T", " ");

    const row = [
      log.musicId,
      "",
      log.level,
      log.level,
      log.score,
      "0",
      "0",
      clear,
      full_combo,
      full_chain,
      rank_str,
      upload_time,
      play_time,
    ];
    csvRows.push(row);
  }
  return csvRows;
}

export function serializeCSV(header, data) {
  const escapeField = (field) => {
    const str = String(field);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = header.map(escapeField).join(",");
  const dataRows = data.map((row) => row.map(escapeField).join(","));
  return [headerRow, ...dataRows].join("\r\n");
}
