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
  if (cmd === 'mcp-docs') {
    const { runMcpDocs } = await import('./mcp-docs.js');
    await runMcpDocs();
    return;
  }
  if (cmd === 'contract') {
    const { runContract } = await import('./contract.js');
    await runContract(subCmd, rest);
    return;
  }
  if (cmd === 'schedule') {
    const { runSchedule } = await import('./schedule.js');
    await runSchedule(subCmd, rest);
    return;
  }
  if (cmd === 'generate') {
    const { runGenerate } = await import('./generate.js');
    await runGenerate(subCmd, rest);
    return;
  }
  if (cmd === 'doctor') {
    const { runDoctor } = await import('./doctor.js');
    await runDoctor([subCmd, ...rest].filter((v): v is string => typeof v === 'string'));
    return;
  }
  const { main } = await import('./serve.js');
  await main();
}

run().catch((err) => {
  console.error('[vitek]', err);
  process.exit(1);
});
