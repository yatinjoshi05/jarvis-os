import { BaseError } from '../../shared/errors/BaseError';

export class CRMError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'CRMError';
  }
}

export class InvalidCustomerError extends CRMError {
  constructor(customerId: string, reason: string, context?: Record<string, unknown>) {
    super(`Customer "${customerId}" is invalid: ${reason}`, context);
    this.name = 'InvalidCustomerError';
  }
}

export class InvalidLeadError extends CRMError {
  constructor(leadId: string, reason: string, context?: Record<string, unknown>) {
    super(`Lead "${leadId}" is invalid: ${reason}`, context);
    this.name = 'InvalidLeadError';
  }
}

export class DuplicateCustomerError extends CRMError {
  constructor(emailOrPhone: string, context?: Record<string, unknown>) {
    super(`Customer with email or phone "${emailOrPhone}" already exists.`, context);
    this.name = 'DuplicateCustomerError';
  }
}

export class DuplicateLeadError extends CRMError {
  constructor(emailOrPhone: string, context?: Record<string, unknown>) {
    super(`Lead with email or phone "${emailOrPhone}" already exists.`, context);
    this.name = 'DuplicateLeadError';
  }
}

export class MissingDocumentError extends CRMError {
  constructor(docId: string, context?: Record<string, unknown>) {
    super(`Required CRM document "${docId}" is missing.`, context);
    this.name = 'MissingDocumentError';
  }
}

export class InvalidPipelineStageError extends CRMError {
  constructor(stage: string, context?: Record<string, unknown>) {
    super(`Pipeline stage "${stage}" is invalid or not registered in config.`, context);
    this.name = 'InvalidPipelineStageError';
  }
}
