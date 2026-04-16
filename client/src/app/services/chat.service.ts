import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatMessage, ChatResponse } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);

  send(messages: ChatMessage[]): Observable<ChatResponse> {
    return this.http.post<ChatResponse>('/api/chat', { messages });
  }
}
