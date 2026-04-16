import { Component, Input, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ResolvedSection } from '../../models/template.model';
import { PdfService } from '../../services/pdf.service';

@Component({
  selector: 'app-document-preview',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: './document-preview.component.html',
  styleUrl: './document-preview.component.scss',
})
export class DocumentPreviewComponent {
  @Input({ required: true }) sections!: ResolvedSection[];
  @Input({ required: true }) documentTitle!: string;

  private pdfService = inject(PdfService);

  downloadPdf(): void {
    const slug = this.documentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const fileName = `${slug}-${Date.now()}.pdf`;
    this.pdfService.generate(this.documentTitle, this.sections, fileName);
  }
}
