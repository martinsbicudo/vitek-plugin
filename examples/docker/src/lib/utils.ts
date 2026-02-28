export function getAppVersion(): string {
  return '1.0.0-docker';
}

export function formatTimestamp(): string {
  return new Date().toISOString();
}
