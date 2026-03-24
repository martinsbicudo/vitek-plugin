export type IssueSeverity = 'error' | 'warning' | 'info';

export type IssueSource =
  | 'runtime.http'
  | 'runtime.hook'
  | 'contract.check'
  | 'doctor'
  | 'manual';

export interface IssueSuggestion {
  title: string;
  detail?: string;
}

export interface IssueEvent {
  id: string;
  timestamp: string;
  severity: IssueSeverity;
  source: IssueSource;
  title: string;
  message: string;
  route?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  suggestions?: IssueSuggestion[];
}

export interface IssueDispatcher {
  dispatch(event: IssueEvent): void | Promise<void>;
}
