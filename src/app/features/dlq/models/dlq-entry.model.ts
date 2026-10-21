export interface DlqEntryItem {
  id: string;
  payload: string;
  errorCode: string;
  errorMessage: string;
  failedAt: string;
}
