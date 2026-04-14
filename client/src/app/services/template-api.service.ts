import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentTemplate } from '../models/template.model';

@Injectable({ providedIn: 'root' })
export class TemplateApiService {
  private http = inject(HttpClient);

  getTemplate(id: string): Observable<DocumentTemplate> {
    return this.http.get<DocumentTemplate>(`/api/templates/${id}`);
  }
}
