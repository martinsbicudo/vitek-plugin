let apiRequests = 0;

export function recordApiRequest(): void {
  apiRequests++;
}

export function getApiRequestCount(): number {
  return apiRequests;
}
