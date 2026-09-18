#!/usr/bin/env python3
"""
High-performance fast file reader and directory scanner with 2-tier caching.
Designed for rapid repository exploration and knowledge base ingestion.
"""

import os
import sys
import pathlib
import re
import argparse
import json
import hashlib
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding="utf-8")

CACHE_DIR = pathlib.Path("tmp/cache")
_MEMORY_CACHE = {}

def get_cache_path(key: str) -> pathlib.Path:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    hash_key = hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]
    safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', key)[:32]
    return CACHE_DIR / f"{safe_name}_{hash_key}.json"

def get_cached(key: str, max_age_seconds: int = 300):
    if key in _MEMORY_CACHE:
        return _MEMORY_CACHE[key]
    cache_file = get_cache_path(key)
    if cache_file.exists():
        try:
            mtime = cache_file.stat().st_mtime
            if time.time() - mtime < max_age_seconds:
                with open(cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    _MEMORY_CACHE[key] = data
                    return data
        except Exception:
            pass
    return None

def set_cached(key: str, data):
    _MEMORY_CACHE[key] = data
    try:
        cache_file = get_cache_path(key)
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
    except Exception:
        pass

def list_folder(folder_path: str, extensions: list[str] = None) -> list[str]:
    ext_key = ",".join(sorted(extensions)) if extensions else "all"
    cache_key = f"list_{folder_path}_{ext_key}"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    base = pathlib.Path(folder_path)
    if not base.exists():
        return []

    results = []
    norm_exts = [e.lower() if e.startswith(".") else f".{e.lower()}" for e in extensions] if extensions else None

    for root, dirs, files in os.walk(base):
        dirs[:] = [d for d in dirs if d not in (".git", "node_modules", "tmp", ".cache")]
        for file in files:
            p = pathlib.Path(root) / file
            if norm_exts:
                if p.suffix.lower() in norm_exts:
                    results.append(str(p.as_posix()))
            else:
                results.append(str(p.as_posix()))

    results.sort()
    set_cached(cache_key, results)
    return results

def read_file(file_path: str, max_bytes: int = None) -> str:
    cache_key = f"read_{file_path}_{max_bytes}"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    p = pathlib.Path(file_path)
    if not p.exists() or not p.is_file():
        return f"[ERROR: File not found: {file_path}]"

    try:
        with open(p, "r", encoding="utf-8", errors="replace") as f:
            if max_bytes and max_bytes > 0:
                content = f.read(max_bytes)
            else:
                content = f.read()
        set_cached(cache_key, content)
        return content
    except Exception as e:
        return f"[ERROR: {str(e)}]"

def search_pattern(pattern: str, search_path: str = ".", extensions: list[str] = None) -> list[dict]:
    cache_key = f"search_{pattern}_{search_path}_{','.join(extensions) if extensions else 'all'}"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    regex = re.compile(pattern, re.IGNORECASE)
    files = list_folder(search_path, extensions)
    matches = []

    for file_path in files:
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                for line_no, line in enumerate(f, start=1):
                    if regex.search(line):
                        matches.append({
                            "file": file_path,
                            "line": line_no,
                            "content": line.strip()
                        })
        except Exception:
            continue

    set_cached(cache_key, matches)
    return matches

def main():
    parser = argparse.ArgumentParser(description="Fast file reader and scanner for AI")
    parser.add_argument("--list-folder", type=str, help="Recursively list files in directory")
    parser.add_argument("--ext", type=str, help="Comma-separated extensions, e.g. .md,.ts")
    parser.add_argument("--read-file", type=str, help="Fast file content extraction")
    parser.add_argument("--max-bytes", type=int, default=None, help="Maximum bytes to read")
    parser.add_argument("--search-pattern", type=str, help="Regex pattern to search")
    parser.add_argument("--path", type=str, default=".", help="Base path for search or listing")

    args = parser.parse_args()

    exts = [x.strip() for x in args.ext.split(",")] if args.ext else None

    if args.list_folder:
        files = list_folder(args.list_folder, exts)
        print(json.dumps(files, indent=2, ensure_ascii=False))
    elif args.read_file:
        content = read_file(args.read_file, args.max_bytes)
        print(content)
    elif args.search_pattern:
        matches = search_pattern(args.search_pattern, args.path, exts)
        print(json.dumps(matches, indent=2, ensure_ascii=False))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
