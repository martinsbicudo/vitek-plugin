/**
 * Main CLI entry: vitek [command]
 * Commands: init, mcp, serve (default)
 * Usage: vitek init [--force] | vitek mcp | vitek [serve] [options]
 */

const [,, cmd] = process.argv;

async function run(): Promise<void> {
  if (cmd === 'init') {
    const { runInit } = await import('./init.js');
    await runInit();
    return;
  }
  if (cmd === 'mcp') {
    const { runMcpProject } = await import('./mcp-project.js');
    await runMcpProject();
    return;
  }
  const { main } = await import('./serve.js');
  await main();
}

run().catch((err) => {
  console.error('[vitek]', err);
  process.exit(1);
});
