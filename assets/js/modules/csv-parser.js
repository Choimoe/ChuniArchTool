export function parseCSV(text) {
  const lines = text.trim().replace(/\r\n/g, "\n").split("\n");
  if (lines.length === 0) throw new Error("CSV 文件为空");

  const header = lines[0].split(",");
  const data = lines.slice(1).map((line) => line.split(","));

  const colCount = header.length;
  for (let i = 0; i < data.length; i++) {
    if (data[i].length !== colCount) {
      console.warn(
        `CSV 第 ${i + 2} 行 (内容: ${data[i]}) 列数 ${
          data[i].length
        } 与表头 ${colCount} 不匹配，已忽略该行。`
      );
      const filteredData = data.filter((row) => row.length === colCount);
      return { header, data: filteredData };
    }
  }

  return { header, data };
}
