// Weekly traction snapshot (TSK-033) and the ADR-0005 kill criteria (TSK-020).
//
//   node scripts/traction-snapshot.mjs            append this week's row to docs/metrics/traction.jsonl
//   node scripts/traction-snapshot.mjs --dry-run  print the row and change nothing
//   node scripts/traction-snapshot.mjs --review   print the kill-criteria verdict for the latest row
//
// Sources: api.npmjs.org (downloads), the GitHub API through `gh` (issues, PRs, stars, traffic;
// traffic needs push access to the repo), and docs/metrics/manual.json for what only a human
// knows (starter adoption, target-list PRs, agent eval scores). Rows are append-only so the
// 12-week review has history beyond GitHub's 14-day traffic window.
import { execFile } from 'node:child_process';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const REPO = 'jmlweb/svgworm';
const PACKAGES = ['svgworm', '@svgworm/react'];
const MAINTAINERS = new Set(['jmlweb']);
const LOG = new URL('../docs/metrics/traction.jsonl', import.meta.url);
const MANUAL = new URL('../docs/metrics/manual.json', import.meta.url);

// ADR-0005. Fixed; a change needs a superseding ADR.
const KILL_CRITERIA = {
  weeklyDownloads4wAvg: 500,
  distinctExternalAuthors: 5,
  starterAdoptions: 1,
};

const run = promisify(execFile);
const isDryRun = process.argv.includes('--dry-run');
const isReview = process.argv.includes('--review');

const gh = async (path, { paginate = false } = {}) => {
  try {
    const { stdout } = await run('gh', [
      'api',
      ...(paginate ? ['--paginate', '--slurp'] : []),
      path,
    ]);
    const parsed = JSON.parse(stdout);
    return paginate ? parsed.flat() : parsed;
  } catch {
    return null;
  }
};

// 404 means "not published"; anything else is an outage and must not be logged as zero
// downloads, because the kill-criteria review would read it as a real number.
const npmDownloads = async (pkg) => {
  let response;
  try {
    response = await fetch(
      `https://api.npmjs.org/downloads/range/last-month/${pkg}`,
    );
  } catch (error) {
    return { error: `fetch failed: ${error.message}` };
  }
  if (response.status === 404)
    return { lastWeek: 0, fourWeekAverage: 0, isPublished: false };
  if (!response.ok) return { error: `HTTP ${response.status}` };
  const { downloads } = await response.json();
  const days = downloads.map((day) => day.downloads);
  const sum = (list) => list.reduce((total, value) => total + value, 0);
  return {
    lastWeek: sum(days.slice(-7)),
    fourWeekAverage: Math.round(sum(days.slice(-28)) / 4),
    isPublished: true,
  };
};

const externalAuthors = async () => {
  const items = await gh(`repos/${REPO}/issues?state=all&per_page=100`, {
    paginate: true,
  });
  if (items === null) return null;
  const logins = new Set(
    items
      .map((item) => item.user?.login ?? '')
      .filter(
        (login) =>
          login !== '' && !MAINTAINERS.has(login) && !login.endsWith('[bot]'),
      ),
  );
  return {
    count: logins.size,
    logins: [...logins].toSorted((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    issuesAndPrs: items.length,
  };
};

const readManual = async () => {
  try {
    return JSON.parse(await readFile(MANUAL, 'utf8'));
  } catch {
    return {};
  }
};

const snapshot = async () => {
  const [repo, referrers, views, clones, authors, manual, ...downloads] =
    await Promise.all([
      gh(`repos/${REPO}`),
      gh(`repos/${REPO}/traffic/popular/referrers`),
      gh(`repos/${REPO}/traffic/views`),
      gh(`repos/${REPO}/traffic/clones`),
      externalAuthors(),
      readManual(),
      ...PACKAGES.map(npmDownloads),
    ]);
  // A row with a failed source is marked, kept out of the review, and fails the run.
  const failures = [
    ...downloads.flatMap((result, index) =>
      result.error === undefined
        ? []
        : [`npm ${PACKAGES[index]}: ${result.error}`],
    ),
    ...(repo === null ? ['github repo'] : []),
    ...(authors === null ? ['github issues'] : []),
  ];
  return {
    date: new Date().toISOString().slice(0, 10),
    ...(failures.length === 0 ? {} : { incomplete: failures }),
    npm: Object.fromEntries(
      PACKAGES.map((pkg, index) => [pkg, downloads[index]]),
    ),
    github: {
      stars: repo?.stargazers_count ?? null,
      forks: repo?.forks_count ?? null,
      openIssues: repo?.open_issues_count ?? null,
      externalAuthors: authors,
      // 14-day windows: the reason this log exists.
      views14d:
        views === null ? null : { count: views.count, uniques: views.uniques },
      clones14d:
        clones === null
          ? null
          : { count: clones.count, uniques: clones.uniques },
      referrers14d: (referrers ?? []).map((item) => ({
        referrer: item.referrer,
        count: item.count,
        uniques: item.uniques,
      })),
    },
    manual: {
      starters: manual.starters ?? [],
      targetListPrs: manual.targetListPrs ?? { opened: 0, merged: 0 },
      agentEval: manual.agentEval ?? null,
      launchDate: manual.launchDate ?? null,
    },
  };
};

const review = (row) => {
  if (row.incomplete !== undefined) {
    return `Kill-criteria review (ADR-0005) for ${row.date}: no verdict, the snapshot is incomplete (${row.incomplete.join('; ')}). Rerun it.`;
  }
  const downloads = row.npm['svgworm']?.fourWeekAverage ?? 0;
  const authors = row.github.externalAuthors?.count ?? 0;
  const starters = row.manual.starters.length;
  const results = [
    [
      '>= 500 weekly npm downloads (4-week average)',
      downloads,
      downloads >= KILL_CRITERIA.weeklyDownloads4wAvg,
    ],
    [
      '>= 5 issues or PRs from distinct external people',
      authors,
      authors >= KILL_CRITERIA.distinctExternalAuthors,
    ],
    [
      'adoption by one public starter or template',
      starters,
      starters >= KILL_CRITERIA.starterAdoptions,
    ],
  ];
  const launch = row.manual.launchDate;
  const reviewDate =
    launch === null
      ? 'unknown (record manual.json launchDate)'
      : new Date(new Date(launch).getTime() + 84 * 86_400_000)
          .toISOString()
          .slice(0, 10);
  const lines = [
    `Kill-criteria review (ADR-0005) for ${row.date}. Launch: ${launch ?? 'not yet'}. Review date: ${reviewDate}.`,
    ...results.map(
      ([label, value, ok]) =>
        `  ${ok ? 'PASS' : 'fail'}  ${label}: ${String(value)}`,
    ),
    results.some(([, , ok]) => ok)
      ? 'Verdict: at least one criterion holds. Continue.'
      : 'Verdict: no criterion holds. If this is the review date, stop active development (ADR-0005).',
  ];
  return lines.join('\n');
};

// The latest complete row: an incomplete one never reaches the log, but be safe.
const latestRow = async () => {
  const text = await readFile(LOG, 'utf8').catch(() => '');
  const rows = text
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((row) => row.incomplete === undefined);
  return rows.at(-1) ?? null;
};

if (isReview) {
  const row = (await latestRow()) ?? (await snapshot());
  console.log(review(row));
} else {
  const row = await snapshot();
  console.log(JSON.stringify(row, null, 2));
  if (row.incomplete !== undefined) {
    console.error(`not logged, a source failed: ${row.incomplete.join('; ')}`);
    process.exitCode = 1;
  } else if (!isDryRun) {
    const logPath = fileURLToPath(LOG);
    await mkdir(dirname(logPath), { recursive: true });
    await appendFile(LOG, `${JSON.stringify(row)}\n`);
    console.log(`appended to ${logPath}`);
  }
  console.log(review(row));
}
