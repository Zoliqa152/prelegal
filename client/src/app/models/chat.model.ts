export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface NdaExtractedFields {
  disclosing_party_name: string | null;
  disclosing_party_address: string | null;
  receiving_party_name: string | null;
  receiving_party_address: string | null;
  effective_date: string | null;
  confidentiality_period_years: number | null;
  governing_law_state: string | null;
}

export interface ChatResponse {
  message: string;
  extractedFields: NdaExtractedFields;
}
