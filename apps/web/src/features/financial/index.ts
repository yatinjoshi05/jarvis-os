/**
 * Public API for the financial feature module.
 * Re-exports the core financial entities to avoid duplicate code.
 */
export * from '../../entities/financial';
export { default as financialManager } from '../../entities/financial/FinancialManager';
