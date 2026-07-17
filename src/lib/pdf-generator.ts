/**
 * Simple dependency-free PDF Generator for I.Me.Con
 * Generates valid PDF documents matching A4 size with custom grids, text styling, and multiple pages.
 */

export class SimplePDF {
  private objects: { id: number; content: string | Buffer }[] = [];
  private nextId = 1;
  private pages: { contentId: number; stream: string }[] = [];

  constructor() {}

  private getNewId() {
    return this.nextId++;
  }

  public addPage() {
    const contentId = this.getNewId();
    this.pages.push({ contentId, stream: "" });
  }

  private writeStream(commands: string) {
    if (this.pages.length === 0) {
      this.addPage();
    }
    this.pages[this.pages.length - 1].stream += commands;
  }

  // Draw a solid line
  public line(x1: number, y1: number, x2: number, y2: number, lineWidth = 1, color = "0.7 0.7 0.7") {
    const py1 = 842 - y1;
    const py2 = 842 - y2;
    this.writeStream(`${color} RG\n${lineWidth} w\n${x1} ${py1} m\n${x2} ${py2} l\nS\n`);
  }

  // Draw an outline rectangle
  public rect(x: number, y: number, w: number, h: number, lineWidth = 1, color = "0.8 0.8 0.8") {
    const py = 842 - (y + h);
    this.writeStream(`${color} RG\n${lineWidth} w\n${x} ${py} ${w} ${h} re\nS\n`);
  }

  // Draw a filled rectangle (e.g. for header background)
  public filledRect(x: number, y: number, w: number, h: number, fillColor = "0.95 0.95 0.95") {
    const py = 842 - (y + h);
    this.writeStream(`${fillColor} rg\n${x} ${py} ${w} ${h} re\nf\n`);
  }

  // Add text to the current page
  public text(str: string, x: number, y: number, font = "F2", size = 10, color = "0 0 0") {
    const py = 842 - y;
    const escaped = this.escape(str);
    this.writeStream(`BT\n${color} rg\n/${font} ${size} Tf\n${x} ${py} Td\n(${escaped}) Tj\nET\n`);
  }

  private escape(str: string) {
    if (!str) return "";
    return str
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  }

  // Simple word wrapper approximating Helvetica character widths
  public wrapText(str: string, maxWidth: number, fontSize: number): string[] {
    if (!str) return [];
    const avgCharWidth = fontSize * 0.48; // Helvetica average character width factor
    const maxChars = Math.floor(maxWidth / avgCharWidth);
    const paragraphs = str.split("\n");
    const lines: string[] = [];

    for (const p of paragraphs) {
      const cleanP = p.replace(/\r/g, "");
      if (cleanP.trim() === "") {
        lines.push("");
        continue;
      }
      const words = cleanP.split(" ");
      let currentLine = "";
      for (const word of words) {
        if ((currentLine + " " + word).length <= maxChars) {
          currentLine = currentLine === "" ? word : currentLine + " " + word;
        } else {
          if (currentLine !== "") {
            lines.push(currentLine);
          }
          currentLine = word;
        }
      }
      if (currentLine !== "") {
        lines.push(currentLine);
      }
    }
    return lines;
  }

  // Writes a block of wrapped text and returns the next Y position
  public textBlock(str: string, x: number, y: number, maxWidth: number, fontSize = 10, font = "F2", lineHeight = 14, color = "0.2 0.2 0.2"): number {
    const lines = this.wrapText(str, maxWidth, fontSize);
    let currentY = y;
    for (const line of lines) {
      if (line.trim() !== "") {
        this.text(line, x, currentY, font, fontSize, color);
      }
      currentY += lineHeight;
    }
    return currentY;
  }

  // Compiles and constructs the PDF Buffer
  public compile(): Buffer {
    if (this.pages.length === 0) {
      this.addPage();
    }

    const catalogId = this.getNewId();
    const pagesId = this.getNewId();
    const fontBoldId = this.getNewId();
    const fontRegId = this.getNewId();

    const pageIds: number[] = [];
    for (let i = 0; i < this.pages.length; i++) {
      pageIds.push(this.getNewId());
    }

    // Add page content streams
    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      const streamContent = page.stream;
      const streamBuffer = Buffer.from(streamContent, "utf-8");
      const contentObj = `<< /Length ${streamBuffer.length} >>\nstream\n${streamContent}\nendstream`;
      this.objects.push({ id: page.contentId, content: Buffer.from(contentObj, "utf-8") });
    }

    // Add Catalog
    this.objects.push({
      id: catalogId,
      content: `<< /Type /Catalog /Pages ${pagesId} 0 R >>`
    });

    // Add Pages
    const kidsStr = pageIds.map(pid => `${pid} 0 R`).join(" ");
    this.objects.push({
      id: pagesId,
      content: `<< /Type /Pages /Kids [${kidsStr}] /Count ${pageIds.length} >>`
    });

    // Add Fonts
    this.objects.push({
      id: fontBoldId,
      content: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`
    });
    this.objects.push({
      id: fontRegId,
      content: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`
    });

    // Add Page Objects
    for (let i = 0; i < pageIds.length; i++) {
      const pid = pageIds[i];
      const pageInfo = this.pages[i];
      this.objects.push({
        id: pid,
        content: `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontBoldId} 0 R /F2 ${fontRegId} 0 R >> >> /Contents ${pageInfo.contentId} 0 R >>`
      });
    }

    // Sort objects by ID for correct writing
    this.objects.sort((a, b) => a.id - b.id);

    // Write file segments and calculate exact cross-reference offsets
    const header = "%PDF-1.4\n";
    let currentOffset = header.length;
    const offsets: number[] = [];
    const buffers: Buffer[] = [Buffer.from(header, "utf-8")];

    for (const obj of this.objects) {
      offsets[obj.id] = currentOffset;
      const objHeader = `${obj.id} 0 obj\n`;
      const objFooter = "\nendobj\n";
      
      const contentBuffer = typeof obj.content === "string" ? Buffer.from(obj.content, "utf-8") : obj.content;
      const fullObjBuffer = Buffer.concat([
        Buffer.from(objHeader, "utf-8"),
        contentBuffer,
        Buffer.from(objFooter, "utf-8")
      ]);
      
      buffers.push(fullObjBuffer);
      currentOffset += fullObjBuffer.length;
    }

    const xrefOffset = currentOffset;
    
    // Construct xref table
    let xref = `xref\n0 ${this.objects.length + 1}\n0000000000 65535 f \r\n`;
    for (let i = 1; i <= this.objects.length; i++) {
      const offset = offsets[i] || 0;
      const paddedOffset = String(offset).padStart(10, "0");
      xref += `${paddedOffset} 00000 n \r\n`;
    }

    const trailer = `trailer\n<< /Size ${this.objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    
    buffers.push(Buffer.from(xref + trailer, "utf-8"));

    return Buffer.concat(buffers);
  }
}
