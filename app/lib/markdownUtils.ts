export function convertHtmlTablesToMarkdown(text: string): string {
  if (!text || !text.includes("<table")) return text;
  return text.replace(/<table[\s\S]*?<\/table>/gi, (tableHtml) => {
    const rows: string[][] = [];
    const rowMatches = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    for (const rowHtml of rowMatches) {
      const cellMatches = rowHtml.match(/<(th|td)[\s\S]*?<\/\1>/gi) || [];
      const cells = cellMatches.map((c) =>
        c.replace(/<[^>]+>/g, "").replace(/\r?\n/g, " ").trim()
      );
      if (cells.length > 0) rows.push(cells);
    }
    if (rows.length < 2) return tableHtml;
    const maxCols = Math.max(...rows.map((r) => r.length));
    const header = rows[0];
    while (header.length < maxCols) header.push("");
    const mdLines = [
      "| " + header.map(c => c.replace(/\|/g, "\\|")).join(" | ") + " |",
      "| " + Array(maxCols).fill("---").join(" | ") + " |",
    ];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      while (r.length < maxCols) r.push("");
      mdLines.push("| " + r.map(c => c.replace(/\|/g, "\\|")).join(" | ") + " |");
    }
    return "\n\n" + mdLines.join("\n") + "\n\n";
  });
}

export function convertPlainTablesToMarkdown(markdown: string): string {
  if (!markdown) return "";
  const lines = markdown.split(/\r?\n/);
  const result: string[] = [];
  let i = 0;
  let inCodeBlock = false;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      i++;
      continue;
    }

    if (inCodeBlock) {
      result.push(line);
      i++;
      continue;
    }

    const isSpecial = (t: string) => {
      if (!t) return true;
      if (t.startsWith("#") || t.startsWith(">") || t.startsWith("```") || t.startsWith("|")) return true;
      if (/^[-*+]\s/.test(t)) return true; // unordered list
      if (/^\d+[\.\)]\s/.test(t)) return true; // 1. or 1)
      if (/^[A-Za-z][\.\)]\s/.test(t)) return true; // A. or A)
      if (t.endsWith(":")) return true; // section label
      return false;
    };

    if (!isSpecial(trimmed) && trimmed.length <= 300) {
      const cells = trimmed.split(/\t+|\s{2,}/).map(c => c.trim()).filter(Boolean);
      const firstCellEndsWithColon = cells.length > 0 && cells[0].endsWith(":");
      const cellsAreReasonable = cells.length >= 2 && cells.every(c => c.length <= 150) && !firstCellEndsWithColon;

      if (cellsAreReasonable) {
        const targetCols = cells.length;
        const block = [{ lineIndex: i, cells }];
        let j = i + 1;
        let emptyCount = 0;

        while (j < lines.length) {
          const nextTrimmed = lines[j].trim();
          if (!nextTrimmed) {
            emptyCount++;
            if (emptyCount > 1) break; // at most 1 empty line
            j++;
            continue;
          }
          if (isSpecial(nextTrimmed) || nextTrimmed.length > 300) break;

          const nextCells = nextTrimmed.split(/\t+|\s{2,}/).map(c => c.trim()).filter(Boolean);
          const nextFirstCellEndsWithColon = nextCells.length > 0 && nextCells[0].endsWith(":");
          if (nextCells.length === targetCols && nextCells.every(c => c.length <= 150) && !nextFirstCellEndsWithColon) {
            block.push({ lineIndex: j, cells: nextCells });
            emptyCount = 0;
            j++;
          } else {
            break;
          }
        }

        // At least 2 rows with the exact same column count
        if (block.length >= 2) {
          const tableLines = [];
          // Header
          tableLines.push("| " + block[0].cells.map(c => c.replace(/\|/g, "\\|")).join(" | ") + " |");
          // Separator
          tableLines.push("| " + Array(targetCols).fill("---").join(" | ") + " |");
          // Data rows
          for (let r = 1; r < block.length; r++) {
            tableLines.push("| " + block[r].cells.map(c => c.replace(/\|/g, "\\|")).join(" | ") + " |");
          }

          result.push("");
          result.push(...tableLines);
          result.push("");
          i = j;
          continue;
        }
      }
    }

    result.push(line);
    i++;
  }

  return result.join("\n");
}

export function preprocessMarkdown(content: string): string {
  if (!content) return "";
  let processed = convertHtmlTablesToMarkdown(content);
  processed = convertPlainTablesToMarkdown(processed);
  return processed;
}
