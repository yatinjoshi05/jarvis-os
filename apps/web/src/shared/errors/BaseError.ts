/**
 * Base class for all custom errors in JARVIS OS.
 */
export class BaseError extends Error {
  /**
   * Additional metadata or context associated with the error.
   */
  public readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
