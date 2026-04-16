export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SelectionResponse {
  phase: 'selection';
  message: string;
  selectedTemplateId: string | null;
}

export interface CollectionResponse {
  phase: 'collection';
  message: string;
  extractedFields: Record<string, string | number | null>;
  allFieldsFilled: boolean;
}

export type ChatResponse = SelectionResponse | CollectionResponse;
