import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChatPanelComponent } from '../chat-panel/chat-panel.component';
import { DocumentPreviewComponent } from '../document-preview/document-preview.component';
import { TemplateApiService } from '../../services/template-api.service';
import { TemplateEngineService } from '../../services/template-engine.service';
import { ChatService } from '../../services/chat.service';
import { DocumentTemplate, ResolvedSection } from '../../models/template.model';
import { ChatMessage, NdaExtractedFields } from '../../models/chat.model';

@Component({
  selector: 'app-nda-creator',
  standalone: true,
  imports: [ChatPanelComponent, DocumentPreviewComponent, MatProgressSpinnerModule],
  templateUrl: './nda-creator.component.html',
  styleUrl: './nda-creator.component.scss',
})
export class NdaCreatorComponent implements OnInit, OnDestroy {
  private templateApi = inject(TemplateApiService);
  private templateEngine = inject(TemplateEngineService);
  private chatService = inject(ChatService);
  private destroy$ = new Subject<void>();

  template = signal<DocumentTemplate | null>(null);
  chatMessages = signal<ChatMessage[]>([]);
  chatLoading = signal(false);
  extractedFields = signal<NdaExtractedFields>({
    disclosing_party_name: null,
    disclosing_party_address: null,
    receiving_party_name: null,
    receiving_party_address: null,
    effective_date: null,
    confidentiality_period_years: null,
    governing_law_state: null,
  });

  formValues = computed<Record<string, unknown>>(() => {
    const fields = this.extractedFields();
    const values: Record<string, unknown> = { nda_type: 'Mutual' };
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
    this.templateApi
      .getTemplate('nda')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tmpl) => {
          this.template.set(tmpl);
          this.requestGreeting();
        },
        error: (err) => {
          console.error('Failed to load template:', err);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSendMessage(text: string): void {
    const userMsg: ChatMessage = { role: 'user', content: text };
    this.chatMessages.update((msgs) => [...msgs, userMsg]);
    this.sendToApi();
  }

  private requestGreeting(): void {
    this.sendToApi();
  }

  private sendToApi(): void {
    this.chatLoading.set(true);
    const messages = this.chatMessages();

    this.chatService
      .send(messages)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const assistantMsg: ChatMessage = { role: 'assistant', content: response.message };
          this.chatMessages.update((msgs) => [...msgs, assistantMsg]);
          this.extractedFields.set(response.extractedFields);
          this.chatLoading.set(false);
        },
        error: (err) => {
          console.error('Chat error:', err);
          const errorMsg: ChatMessage = {
            role: 'assistant',
            content: 'Sorry, something went wrong. Please try again.',
          };
          this.chatMessages.update((msgs) => [...msgs, errorMsg]);
          this.chatLoading.set(false);
        },
      });
  }
}
