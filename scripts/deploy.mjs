// Deploys threebabybirdies.com to Hostinger over SSH, so nobody has to type commands into hPanel.
// Same pattern as the ODA website's scripts/deploy-godaddy.mjs.
//
// Settings come from .env.deploy in the repo folder (never committed; copy .env.deploy.example):
//   SSH_HOST, SSH_USER, SSH_PORT, SSH_KEY, LIVE_DIR, STAGING_DIR, SITE_URL, STAGING_URL
// One-time setup (SSH key, hPanel) is in docs/DEPLOY.md.
//
//   node scripts/deploy.mjs check            show the server, PHP version and both site folders (changes nothing)
//   node scripts/deploy.mjs staging          upload the committed site to the test folder, then test it
//   node scripts/deploy.mjs release          snapshot the live site, upload the committed site, then test it
//   node scripts/deploy.mjs verify           test the live site (/book loads, /book.html redirects, ...)
//   node scripts/deploy.mjs snapshot         copy the live site's files to ~/backups on the server
//   node scripts/deploy.mjs snapshots        list the snapshots
//   node scripts/deploy.mjs rollback         put the most recent snapshot back (undo the last release)
//   node scripts/deploy.mjs restore <file>   put a specific snapshot back
//
// What is uploaded is the last COMMIT (git HEAD), not whatever is lying in the folder, so a half-edited
// file never reaches the site. Commit first, then deploy.
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const root = join(import.meta.dirname, '..');
const envFile = process.env.DEPLOY_ENV || join(root, '.env.deploy');
if (!existsSync(envFile)) fail(`Missing ${envFile}. Copy .env.deploy.example to .env.deploy and fill it in (see docs/DEPLOY.md).`);
const env = Object.fromEntries(readFileSync(envFile, 'utf8').split(/\r?\n/).filter((l) => /^\w+=/.test(l))
  .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
if (!env.SSH_HOST || !env.SSH_USER) fail('Set SSH_HOST and SSH_USER in .env.deploy.');

const LIVE = env.LIVE_DIR || 'public_html';
const STAGING = env.STAGING_DIR || '';
const SITE = (env.SITE_URL || 'https://threebabybirdies.com').replace(/\/$/, '');
const STAGING_SITE = (env.STAGING_URL || '').replace(/\/$/, '');
// A test subdomain's folder may sit inside public_html; never delete it while replacing the live site.
const NESTED = STAGING.startsWith(`${LIVE}/`) ? STAGING.slice(LIVE.length + 1).split('/')[0] : '';
// Things in the web root that are not ours and must survive a release or a restore.
const KEEP = ['cgi-bin', '.well-known', '.user.ini', NESTED, ...(env.KEEP || '').split(',')].map((s) => s.trim()).filter(Boolean);
// Repo files that are not part of the website.
const NOT_SITE = ['README.txt', '_headers', '_redirects', 'router.php', 'tools', 'scripts', 'docs', '.gitignore', '.gitattributes', '.env.deploy.example'];

// Git for Windows' ssh accepts a key file without Windows permission changes; otherwise use the ssh on PATH.
const gitSsh = 'C:\\Program Files\\Git\\usr\\bin\\ssh.exe';
const SSH = env.SSH_BIN || (existsSync(gitSsh) ? gitSsh : 'ssh');
const KEY = env.SSH_KEY || join(homedir(), '.ssh', 'threebabybirdies_deploy');
const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`; // quote for the remote shell
const keepCase = KEEP.map(q).join('|');

function fail(msg) { console.error(`\n${msg}\n`); process.exit(1); }

/** Run a bash script on the server (sent base64-encoded, so no quoting problems). `input` becomes its stdin. */
function remote(script, input) {
  const b64 = Buffer.from(`set -e -o pipefail\ncd ~\n${script}`).toString('base64');
  const args = ['-i', KEY, '-p', env.SSH_PORT || '22', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new',
    '-o', 'ConnectTimeout=20', `${env.SSH_USER}@${env.SSH_HOST}`, `bash -c "$(echo ${b64} | base64 -d)"`];
  const r = spawnSync(SSH, args, { input, stdio: [input ? 'pipe' : 'ignore', 'inherit', 'inherit'], maxBuffer: 1 << 30 });
  if (r.error) fail(`Could not start ssh (${r.error.code}). On Windows, install Git for Windows (it brings ssh), or set SSH_BIN in .env.deploy.`);
  if (r.status === 255) fail('Could not sign in over SSH. Check SSH_HOST, SSH_USER, SSH_PORT and SSH_KEY in .env.deploy, and that the key is added in hPanel (docs/DEPLOY.md).');
  if (r.status !== 0) fail(`Server step failed (exit ${r.status}). Nothing after this step was done.`);
}

/** The committed website as a .tar.gz (git HEAD, minus the repo-only files). */
function siteArchive() {
  const dirty = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).stdout.trim();
  if (dirty) console.log('Note: you have uncommitted changes. They are NOT uploaded; only the last commit is.\n');
  const paths = ['.', ...NOT_SITE.map((p) => `:(exclude)${p}`), ':(exclude).env*'];
  const tar = spawnSync('git', ['archive', '--format=tar.gz', 'HEAD', '--', ...paths], { cwd: root, maxBuffer: 1 << 30 });
  if (tar.status !== 0) fail(`git archive failed: ${tar.stderr}`);
  // The same selection as the archive (ls-tree does not understand :(exclude), so filter here).
  const files = spawnSync('git', ['ls-tree', '-r', '--name-only', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim().split('\n')
    .filter((f) => !f.startsWith('.env') && !NOT_SITE.some((p) => f === p || f.startsWith(p + '/')));
  if (!files.includes('index.php') || !files.includes('.htaccess')) fail('This commit has no index.php or .htaccess; refusing to upload it.');
  const head = spawnSync('git', ['log', '-1', '--format=%h %s'], { cwd: root, encoding: 'utf8' }).stdout.trim();
  return { tar: tar.stdout, files, head };
}

/** Replace the site files in `target` with the commit. Files of the previous release that are gone from this
 *  one are removed (the manifest lives in ~/backups, outside the web root); on the very first release, the old
 *  top-level .html pages are removed instead, since the site is .php now. Nothing in KEEP is touched. */
function upload(target, archive = siteArchive()) {
  const { tar, files, head } = archive;
  console.log(`Uploading ${head} (${files.length} files, ${(tar.length / 1048576).toFixed(1)} MB) to ${target}/ …`);
  const manifest = Buffer.from(files.join('\n') + '\n').toString('base64');
  remote(`
T=${q(target)}
M="$HOME/backups/manifest-$(echo "$T" | tr '/' '_').txt"
mkdir -p "$T" backups
# Hostinger keeps the PHP version in a block inside .htaccess; carry it into the new .htaccess.
BLOCK=""; [ -f "$T/.htaccess" ] && BLOCK="$(sed -n '/# php -- BEGIN/,/# php -- END/p' "$T/.htaccess")"
echo ${manifest} | base64 -d > "$M.new"
tar -xzf - -C "$T"
cd "$T"
if [ -f "$M" ]; then
  # Files the previous release had and this one does not.
  # (grep finds nothing on most releases and returns 1; that is not a failure, hence the || true)
  { grep -vxFf "$M.new" "$M" || true; } | while IFS= read -r f; do
    case "\${f%%/*}" in ${keepCase}) continue;; esac
    if [ -f "$f" ]; then rm -f -- "$f"; echo "  removed $f"; fi
  done
else
  # First release with this script: the site used to be .html, and the old manual uploads carried
  # repo-only files along with it.
  for f in *.html; do if [ -f "$f" ]; then rm -f -- "$f"; echo "  removed old page $f"; fi; done
  for f in README.txt _headers _redirects router.php .gitignore tools/stamp_assets.py; do if [ -f "$f" ]; then rm -f -- "$f"; echo "  removed $f"; fi; done
  rmdir tools 2>/dev/null || true
fi
mv "$M.new" "$M"
[ -n "$BLOCK" ] && printf '\\n%s\\n' "$BLOCK" >> .htaccess && echo "Kept the hPanel PHP version setting in .htaccess."
chmod -R u=rwX,go=rX $(echo ${manifest} | base64 -d | cut -d/ -f1 | sort -u | tr '\\n' ' ')
echo "Done: ${files.length} files in $T/"
`, tar);
}

/** Load the pages over the internet and check that they behave as the site expects. */
async function verify(base) {
  if (!base) { console.log('No URL set for this site in .env.deploy, so it was not tested.'); return true; }
  const tests = [
    ['/', 200], ['/book', 200], ['/about', 200], ['/chatbot', 200], ['/blog', 200], ['/login', 200],
    ['/book.html', 301, '/book'], ['/book.php', 301, '/book'], ['/index.html', 301, '/'],
    ['/reset-password.html?token=t', 301, '/reset-password?token=t'],
    ['/css/main.css', 200], ['/this-page-does-not-exist', 404], ['/tools/stamp_assets.py', 404],
  ];
  console.log(`\nTesting ${base} …`);
  let bad = 0;
  for (const [path, want, to] of tests) {
    let got, loc = '';
    try {
      const r = await fetch(base + path, { redirect: 'manual', headers: { 'cache-control': 'no-cache' } });
      got = r.status; loc = (r.headers.get('location') || '').replace(base, '');
    } catch (e) { got = e.cause?.code || e.message; }
    const ok = got === want && (!to || loc === to);
    if (!ok) bad++;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${path.padEnd(32)} ${got}${loc ? ' -> ' + loc : ''}${ok ? '' : `   (expected ${want}${to ? ' -> ' + to : ''})`}`);
  }
  if (bad) console.log(`\n${bad} check(s) failed. If the site is broken, undo the release with:  node scripts/deploy.mjs rollback`);
  else console.log('\nAll checks passed.');
  return bad === 0;
}

function snapshot() {
  remote(`
mkdir -p backups
F="backups/tbb-site-$(date -u +%Y%m%d-%H%M%S)-$$.tar.gz"
tar -czf "$F" -C ${q(LIVE)} ${KEEP.map((k) => `--exclude=${q('./' + k)}`).join(' ')} .
echo "Snapshot: ~/$F ($(du -h "$F" | cut -f1))"
# Keep the 15 most recent.
ls -1t backups/tbb-site-*.tar.gz | tail -n +16 | xargs -r rm -f
`);
}

function restore(file) {
  if (file !== 'latest' && !/^tbb-site-[\d-]+\.tar\.gz$/.test(file)) fail('Usage: node scripts/deploy.mjs restore tbb-site-YYYYMMDD-HHMMSS-NNNN.tar.gz   (see: snapshots)');
  remote(`
S=${file === 'latest' ? '"$(ls -1t backups/tbb-site-*.tar.gz 2>/dev/null | head -1)"' : q('backups/' + file)}
[ -n "$S" ] && [ -f "$S" ] || { echo "No snapshot found."; exit 3; }
cd ${q(LIVE)}
for f in * .[!.]* ..?*; do
  [ -e "$f" ] || [ -L "$f" ] || continue
  [ -L "$f" ] && continue
  case "$f" in ${keepCase}) continue;; esac
  rm -rf -- "$f"
done
tar -xzf "$HOME/$S"
rm -f "$HOME/backups/manifest-$(echo ${q(LIVE)} | tr '/' '_').txt"
echo "Restored ${LIVE}/ from $(basename "$S")."
`);
}

const cmd = process.argv[2];
if (cmd === 'check') {
  remote(`
echo "Signed in as $(whoami) on $(hostname), home $HOME"
echo "PHP: $(php -v 2>/dev/null | head -1 || echo 'not on PATH')"
echo "Disk: $(df -h ~ 2>/dev/null | tail -1 | awk '{print $4" free of "$2}')"
echo "--- ${LIVE}/:"; ls -A ${q(LIVE)} 2>/dev/null | head -60 || echo "(not found)"
${STAGING ? `echo "--- ${STAGING}/:"; ls -A ${q(STAGING)} 2>/dev/null | head -20 || echo "(not found)"` : 'echo "(no STAGING_DIR set)"'}
echo "--- snapshots:"; ls -1t backups/tbb-site-*.tar.gz 2>/dev/null | head -5 || echo "(none yet)"
`);
} else if (cmd === 'staging') {
  if (!STAGING) fail('Set STAGING_DIR in .env.deploy (the test subdomain\'s folder).');
  upload(STAGING);
  await verify(STAGING_SITE);
} else if (cmd === 'release') {
  const archive = siteArchive(); // checked before anything on the server changes
  console.log('Taking a snapshot of the live site first …');
  snapshot();
  upload(LIVE, archive);
  const ok = await verify(SITE);
  process.exit(ok ? 0 : 1);
} else if (cmd === 'verify') {
  process.exit((await verify(SITE)) ? 0 : 1);
} else if (cmd === 'snapshot') {
  snapshot();
} else if (cmd === 'snapshots') {
  remote('ls -1t backups/tbb-site-*.tar.gz 2>/dev/null | xargs -r -n1 basename || echo "(none yet)"');
} else if (cmd === 'rollback') {
  restore('latest');
  await verify(SITE);
} else if (cmd === 'restore') {
  restore(process.argv[3] || '');
} else {
  console.log('Usage: node scripts/deploy.mjs check | staging | release | verify | snapshot | snapshots | rollback | restore <file>');
}
