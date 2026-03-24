const [,, cmd, subCmd, ...rest] = process.argv;

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
  if (cmd === 'contract') {
    const { runContract } = await import('./contract.js');
    await runContract(subCmd, rest);
    return;
  }
  const { main } = await import('./serve.js');
  await main();
}

run().catch((err) => {
  console.error('[vitek]', err);
  process.exit(1);
});
