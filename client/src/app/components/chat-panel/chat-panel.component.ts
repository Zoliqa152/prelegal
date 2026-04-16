import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ChatMessage } from '../../models/chat.model';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
  ],
  templateUrl: './chat-panel.component.html',
  styleUrl: './chat-panel.component.scss',
})
export class ChatPanelComponent implements OnChanges {
  @Input({ required: true }) messages!: ChatMessage[];
  @Input() loading = false;
  @Output() sendMessage = new EventEmitter<string>();

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  userInput = '';

  ngOnChanges(): void {
    setTimeout(() => this.scrollToBottom());
  }

  onSend(): void {
    const text = this.userInput.trim();
    if (!text || this.loading) return;
    this.userInput = '';
    this.sendMessage.emit(text);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
