export type FieldType = 'text' | 'date' | 'number' | 'select' | 'textarea';

export interface TemplateField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  default?: string | number;
  options?: string[];
}

export interface TemplateSection {
  title: string;
  content: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  jurisdiction: string;
  version: string;
  fields: TemplateField[];
  sections: TemplateSection[];
}

export interface ResolvedSection {
  title: string;
  content: string;
}
