export interface ProviderRequestOptions {
  context?: string;
  history?: Array<{ role: string; content: string }>;
}

export interface AIProvider {
  generateResponse(
    prompt: string,
    onChunk?: (chunk: string) => void,
    options?: ProviderRequestOptions
  ): Promise<string>;

  generateStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: ProviderRequestOptions
  ): Promise<void>;

  cancel(): void;

  healthCheck(): Promise<boolean>;
}