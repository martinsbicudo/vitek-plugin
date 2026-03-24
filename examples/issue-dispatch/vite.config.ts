import { defineConfig } from 'vite';
import { vitek } from 'vitek-plugin/plugin';
import { createBufferingIssueDispatcher } from './src/lib/issue-buffer';

const issueDispatcher = createBufferingIssueDispatcher();

export default defineConfig({
  plugins: [
    vitek({
      issueDispatcher,
    }),
  ],
});
