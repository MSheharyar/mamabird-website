"""Put a content stamp on every local css/js the pages reference.

WHY THIS EXISTS
This host serves css and js with max-age=604800, so for a week after a
deploy a returning visitor keeps running the old file. A fix can be live
and still invisible to the very people who were asked to look at it.

Hashing the file into its own URL makes a changed file a new URL, which
no cache has, so the new one is fetched at once; an unchanged file keeps
its stamp and stays cached. The pages themselves are served no-cache
(see .htaccess) so the new stamps are always picked up.

RUN THIS AFTER CHANGING ANYTHING IN css/ OR js/, then commit the result:

    python tools/stamp_assets.py

It is idempotent: running it twice changes nothing.
"""
import hashlib
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# src="js/x.js", href="/css/main.css", with or without an existing stamp.
# The leading slash is optional: 404.html must use root-relative paths
# because it is served in place of any URL, at any depth.
REF = re.compile(r'(?P<attr>\b(?:src|href)=")(?P<path>/?(?:js|css)/[A-Za-z0-9_./-]+\.(?:js|css))(?:\?v=[0-9a-f]+)?(?P<tail>")')

_cache = {}


def stamp(rel):
    if rel not in _cache:
        full = os.path.join(ROOT, rel.lstrip("/").replace("/", os.sep))
        if not os.path.isfile(full):
            _cache[rel] = None
        else:
            h = hashlib.md5(io.open(full, "rb").read()).hexdigest()[:8]
            _cache[rel] = h
    return _cache[rel]


def main():
    missing, touched, refs = set(), [], 0
    for name in sorted(os.listdir(ROOT)):
        if not name.endswith(".html"):
            continue
        path = os.path.join(ROOT, name)
        src = io.open(path, encoding="utf-8").read()

        def sub(m):
            nonlocal refs
            h = stamp(m.group("path"))
            if h is None:
                missing.add(m.group("path"))
                return m.group(0)
            refs += 1
            return "%s%s?v=%s%s" % (m.group("attr"), m.group("path"), h, m.group("tail"))

        out = REF.sub(sub, src)
        if out != src:
            io.open(path, "w", encoding="utf-8", newline="\n").write(out)
            touched.append(name)

    for n in touched:
        print("  stamped %s" % n)
    print("\n%d references across %d pages, %d files hashed"
          % (refs, len(touched), len([v for v in _cache.values() if v])))
    if missing:
        # A reference to a file that is not there is a broken page, not a
        # caching problem, so say so loudly rather than stamping around it.
        print("\nREFERENCED BUT MISSING:\n  " + "\n  ".join(sorted(missing)))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
