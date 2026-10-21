export interface TransformationErrorEntry {
  id: string;
  correlationId: string;
  failedField: string;
  ruleName: string;
  errorMessage: string;
  createdAt: string;
}
