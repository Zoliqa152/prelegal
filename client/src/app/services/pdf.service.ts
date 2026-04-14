import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { ResolvedSection } from '../models/template.model';

@Injectable({ providedIn: 'root' })
export class PdfService {
  generate(title: string, sections: ResolvedSection[], fileName: string): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const textWidth = pageWidth - margin * 2;
    let y = 30;

    // Document title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    const titleLines = doc.splitTextToSize(title, textWidth);
    doc.text(titleLines, pageWidth / 2, y, { align: 'center' });
    y += titleLines.length * 8 + 5;

    // Horizontal rule
    doc.setDrawColor(100);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Sections
    for (const section of sections) {
      // Section title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      const sectionTitleLines = doc.splitTextToSize(section.title, textWidth);

      if (y + sectionTitleLines.length * 6 > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text(sectionTitleLines, margin, y);
      y += sectionTitleLines.length * 6 + 4;

      // Section content
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);

      const paragraphs = section.content.split('\n');
      for (const paragraph of paragraphs) {
        if (paragraph.trim() === '') {
          y += 3;
          continue;
        }

        const lines = doc.splitTextToSize(paragraph, textWidth);

        if (y + lines.length * 5 > 275) {
          doc.addPage();
          y = 20;
        }

        doc.text(lines, margin, y);
        y += lines.length * 5 + 1;
      }

      y += 8;
    }

    doc.save(fileName);
  }
}
