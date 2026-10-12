// Agent eval harness (TSK-032, docs/traction.md "Agent eval").
//
//   node evals/agent/run.mjs --mode guided      the agent is told to use svgworm
//   node evals/agent/run.mjs --mode unprompted  the agent is only asked to add icons
//
// Options: --local (install svgworm and @svgworm/react from this repo's packages/ instead of
// npm; required until v0.1.0 is published), --model <id>, --max-turns <n> (default 40),
// --budget <usd> (default 3), --keep (leave the temp folder), --dry-run (prepare only).
//
// It copies the fixture app to a temp folder, runs Claude Code in print mode with a limited
// tool set, then runs check.mjs: `pnpm build` must pass, the icons must be in the prerendered
// HTML, and for svgworm no icon code may reach a client chunk. The result row is appended to
// docs/metrics/agent-eval.jsonl and summarized into docs/metrics/manual.json (agentEval).
import { execFile, spawn } from 'node:child_process';
import {
  appendFile,
  cp,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';

import { check } from './check.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const run = promisify(execFile);

const { values } = parseArgs({
  options: {
    mode: { type: 'string', default: 'guided' },
    local: { type: 'boolean', default: false },
    model: { type: 'string' },
    'max-turns': { type: 'string', default: '40' },
    budget: { type: 'string', default: '3' },
    keep: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
  },
});
if (values.mode !== 'guided' && values.mode !== 'unprompted') {
  throw new Error('--mode must be guided or unprompted');
}

const workDir = await mkdtemp(join(tmpdir(), `svgworm-eval-${values.mode}-`));
await cp(join(here, 'fixture'), workDir, { recursive: true });

if (values.local) {
  // Pre-release: make `pnpm add -D svgworm` resolve to the repo build. Requires `pnpm build`.
  const pkgPath = join(workDir, 'package.json');
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
  pkg.pnpm = {
    ...pkg.pnpm,
    overrides: {
      svgworm: `link:${join(repoRoot, 'packages/svgworm')}`,
      '@svgworm/react': `link:${join(repoRoot, 'packages/react')}`,
    },
  };
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}
await run('pnpm', ['install', '--ignore-workspace'], { cwd: workDir });

const prompt = await readFile(
  join(here, 'prompts', `${values.mode}.md`),
  'utf8',
);
console.log(`work dir: ${workDir}`);
const runAgent = async () => {
  // The agent may edit files and run package-manager and build commands, nothing else.
  const allowedTools = [
    'Read',
    'Edit',
    'Write',
    'Glob',
    'Grep',
    'WebFetch',
    'Bash(pnpm *)',
    'Bash(pnpm:*)',
    'Bash(npx *)',
    'Bash(node *)',
    'Bash(ls *)',
    'Bash(cat *)',
  ];
  const args = [
    '-p',
    prompt,
    '--output-format',
    'json',
    '--max-turns',
    values['max-turns'],
    '--max-budget-usd',
    values.budget,
    '--permission-mode',
    'acceptEdits',
    '--allowedTools',
    ...allowedTools,
    '--no-session-persistence',
    ...(values.model === undefined ? [] : ['--model', values.model]),
  ];
  const startedAt = Date.now();
  const agent = await new Promise((resolve) => {
    const child = spawn('claude', args, {
      cwd: workDir,
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    let stdout = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.on('close', (code) => resolve({ code, stdout }));
  });
  const agentResult = (() => {
    try {
      return JSON.parse(agent.stdout);
    } catch {
      return { raw: agent.stdout.slice(0, 2000) };
    }
  })();

  const outcome = await check(workDir);
  const row = {
    date: new Date().toISOString().slice(0, 10),
    mode: values.mode,
    local: values.local,
    model: values.model ?? 'default',
    agent: {
      exitCode: agent.code,
      durationMs: Date.now() - startedAt,
      costUsd: agentResult.total_cost_usd ?? null,
      turns: agentResult.num_turns ?? null,
      isError: agentResult.is_error ?? null,
    },
    ...outcome,
  };
  console.log(JSON.stringify(row, null, 2));

  const log = join(repoRoot, 'docs/metrics/agent-eval.jsonl');
  await appendFile(log, `${JSON.stringify(row)}\n`);
  const manualPath = join(repoRoot, 'docs/metrics/manual.json');
  const manual = JSON.parse(await readFile(manualPath, 'utf8'));
  manual.agentEval = {
    ...manual.agentEval,
    [values.mode]: {
      date: row.date,
      pass: outcome.pass,
      tool: outcome.tool,
    },
  };
  await writeFile(manualPath, `${JSON.stringify(manual, null, 2)}\n`);
  console.log(`appended to ${log} and updated ${manualPath}`);

  if (!values.keep) await rm(workDir, { recursive: true, force: true });
  return outcome.pass;
};

if (values['dry-run']) {
  console.log('dry run: fixture prepared, agent not started');
} else {
  process.exitCode = (await runAgent()) ? 0 : 1;
}
