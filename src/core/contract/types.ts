export type DriftSeverity = 'error' | 'warning';

export interface DriftIssue {
  severity: DriftSeverity;
  code: string;
  message: string;
}
