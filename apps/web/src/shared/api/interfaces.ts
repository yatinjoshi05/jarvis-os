/**
 * Configuration options for the API Client.
 */
export interface ApiClientConfig {
  baseUrl: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
}
