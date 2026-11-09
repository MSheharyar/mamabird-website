# Deploying threebabybirdies.com

One command from your PC uploads the site to Hostinger, tests it, and can undo it.
Nobody needs to type commands into hPanel. (Same setup as the ODA website.)

```
node scripts/deploy.mjs release
```

You need **Node.js** (18 or newer) and **Git for Windows** (which brings `ssh`) on the PC.

## One-time setup (about 10 minutes)

**1. Make an SSH key on your PC.** In PowerShell:

```powershell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\threebabybirdies_deploy -C "threebabybirdies deploy" -N '""'
Get-Content $env:USERPROFILE\.ssh\threebabybirdies_deploy.pub | Set-Clipboard
```

The second line copies the **public** half (`.pub`) to the clipboard. The other file is the private key.
It stays on this PC and is never sent to anyone.

**2. Let the key in on Hostinger.**
- *Web hosting plan:* hPanel → **Advanced → SSH Access**. Enable SSH, then add the key you copied
  under **SSH keys**. The same page shows the **IP, port (65002) and username** (u123456789).
- *VPS:* hPanel → your VPS → **Settings → SSH keys** → add the key. Host = the VPS IP, port 22, user root.

**3. Fill in the settings.** Copy `.env.deploy.example` to `.env.deploy` in this folder and fill it in.
`.env.deploy` is in `.gitignore` and never committed.

**4. Check the connection** (this changes nothing):

```
node scripts/deploy.mjs check
```

It prints the server, its PHP version and what is in the site folder. If `LIVE_DIR` is wrong, the listing
shows it. Fix `.env.deploy` and run it again.

## Releasing

1. Commit your change. **Only the last commit is uploaded**, never half-edited files.
2. If you changed anything in `css/` or `js/`, run `python tools/stamp_assets.py` first and commit the result.
3. `node scripts/deploy.mjs release`

`release` does all of the following:
1. Takes a snapshot of the live site on the server (`~/backups`, the newest 15 are kept).
2. Uploads the commit, and removes files that the previous release had but this one doesn't.
3. Loads the real site and checks it: `/book` loads, `/book.html` redirects to `/book`, the 404 page works.

The first release also removes the old `.html` pages and the repo-only files (README, tools) that were
uploaded by hand before.

**If anything looks wrong:** `node scripts/deploy.mjs rollback` puts the snapshot from just before the
release back.

## Every command

| Command | What it does |
|---|---|
| `check` | Shows the server, its PHP version, the site folders and the snapshots. Changes nothing. |
| `staging` | Uploads to the test folder (`STAGING_DIR`) and tests it (`STAGING_URL`). |
| `release` | Snapshot, upload, test. |
| `verify` | Tests the live site again. |
| `snapshot` | Takes a snapshot now. |
| `snapshots` | Lists the snapshots. |
| `rollback` | Puts the newest snapshot back. |
| `restore <file>` | Puts a specific snapshot back (names come from `snapshots`). |

## Never touched

These are never deleted or overwritten: `cgi-bin`, `.well-known` (SSL certificates), `.user.ini`, the
staging folder if it sits inside the live one, and anything you list in `KEEP=`.

## Local preview

```
php -S localhost:8000 router.php
```

Then open http://localhost:8000/. `router.php` copies the clean URLs from `.htaccess`. It is never
uploaded.
