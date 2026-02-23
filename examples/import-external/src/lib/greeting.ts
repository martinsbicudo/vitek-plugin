export function getGreeting(name?: string): string {
  return name ? `Hello, ${name}!` : 'Hello from lib!';
}

export const APP_VERSION = '1.0.0-import-external';
