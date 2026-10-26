import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "@/lib/admin/csv";

describe("CSV export", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvCell('Smith, "Jo"')).toBe('"Smith, ""Jo"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("neutralises spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvCell("+44 20")).toBe("'+44 20");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });

  it("builds CRLF rows", () => {
    expect(toCsv(["a", "b"], [[1, null]])).toBe("a,b\r\n1,\r\n");
  });
});
