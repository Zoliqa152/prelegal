import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ChatPanelComponent } from '../chat-panel/chat-panel.component';
import { DocumentPreviewComponent } from '../document-preview/document-preview.component';
import { TemplateApiService } from '../../services/template-api.service';
import { TemplateEngineService } from '../../services/template-engine.service';
import { ChatService } from '../../services/chat.service';
import { PdfService } from '../../services/pdf.service';
import { AppTitleService } from '../../services/app-title.service';
import { DocumentTemplate, ResolvedSection } from '../../models/template.model';
import { ChatMessage, ChatResponse, CollectionResponse } from '../../models/chat.model';

@Component({
  selector: 'app-document-creator',
  standalone: true,
  imports: [ChatPanelComponent, DocumentPreviewComponent],
  templateUrl: './document-creator.component.html',
  styleUrl: './document-creator.component.scss',
})
export class DocumentCreatorComponent implements OnInit, OnDestroy {
  private templateApi = inject(TemplateApiService);
  private templateEngine = inject(TemplateEngineService);
  private chatService = inject(ChatService);
  private pdfService = inject(PdfService);
  private appTitle = inject(AppTitleService);
  private destroy$ = new Subject<void>();

  template = signal<DocumentTemplate | null>(null);
  templateId = signal<string | null>(null);
  chatMessages = signal<ChatMessage[]>([]);
  chatLoading = signal(false);
  extractedFields = signal<Record<string, string | number | null>>({});
  private hasAutoDownloaded = false;

  formValues = computed<Record<string, unknown>>(() => {
    const fields = this.extractedFields();
    const values: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value != null) {
        values[key] = value;
      }
    }
    return values;
  });

  resolvedSections = computed<ResolvedSection[]>(() => {
    const tmpl = this.template();
    const values = this.formValues();
    if (!tmpl) return [];
    return this.templateEngine.resolve(tmpl.sections, values);
  });

  ngOnInit(): void {
    this.requestGreeting();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSendMessage(text: string): void {
    const userMsg: ChatMessage = { role: 'user', content: text };
    this.chatMessages.update(msgs => [...msgs, userMsg]);
    this.sendToApi();
  }

  private requestGreeting(): void {
    this.sendToApi();
  }

  private sendToApi(): void {
    this.chatLoading.set(true);
    const messages = this.chatMessages();
    const currentTemplateId = this.templateId();

    this.chatService
      .send(messages, currentTemplateId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ChatResponse) => {
          const assistantMsg: ChatMessage = { role: 'assistant', content: response.message };
          this.chatMessages.update(msgs => [...msgs, assistantMsg]);

          if (response.phase === 'selection' && response.selectedTemplateId) {
            this.onTemplateSelected(response.selectedTemplateId);
          } else if (response.phase === 'collection') {
            this.onFieldsUpdated(response);
          }

          this.chatLoading.set(false);
        },
        error: (err) => {
          console.error('Chat error:', err);
          const errorMsg: ChatMessage = {
            role: 'assistant',
            content: 'Sorry, something went wrong. Please try again.',
          };
          this.chatMessages.update(msgs => [...msgs, errorMsg]);
          this.chatLoading.set(false);
        },
      });
  }

  private onTemplateSelected(id: string): void {
    this.templateId.set(id);
    this.hasAutoDownloaded = false;
    this.templateApi
      .getTemplate(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tmpl) => {
          this.template.set(tmpl);
          this.appTitle.subtitle.set(tmpl.name);
          // Initialize extracted fields with nulls
          const fields: Record<string, string | number | null> = {};
          for (const f of tmpl.fields) {
            fields[f.key] = null;
          }
          this.extractedFields.set(fields);
        },
        error: (err) => console.error('Failed to load template:', err),
      });
  }

  private onFieldsUpdated(response: CollectionResponse): void {
    this.extractedFields.set(response.extractedFields);
    if (response.allFieldsFilled && !this.hasAutoDownloaded) {
      this.hasAutoDownloaded = true;
      // Small delay to let the preview render before downloading
      setTimeout(() => this.downloadPdf(), 500);
    }
  }

  private downloadPdf(): void {
    const tmpl = this.template();
    if (!tmpl) return;
    const sections = this.resolvedSections();
    const slug = tmpl.id;
    const fileName = `${slug}-${Date.now()}.pdf`;
    this.pdfService.generate(tmpl.name, sections, fileName);
  }
}
