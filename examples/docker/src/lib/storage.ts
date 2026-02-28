export const STORAGE_KEY = 'vitek-docker-example';

export function getStoragePrefix(): string {
  return `${STORAGE_KEY}:`;
}
