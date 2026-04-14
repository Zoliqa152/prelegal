import { Injectable } from '@angular/core';
import { TemplateSection, ResolvedSection } from '../models/template.model';

@Injectable({ providedIn: 'root' })
export class TemplateEngineService {
  resolve(
    sections: TemplateSection[],
    values: Record<string, unknown>
  ): ResolvedSection[] {
    return sections.map((section) => ({
      title: section.title,
      content: this.interpolate(section.content, values),
    }));
  }

  private interpolate(
    content: string,
    values: Record<string, unknown>
  ): string {
    return content.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      const value = values[key];
      if (value == null) return '';
      if (value instanceof Date) {
        return value.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      return String(value);
    });
  }
}
