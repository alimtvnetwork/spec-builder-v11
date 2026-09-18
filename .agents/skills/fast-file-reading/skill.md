---
name: fast-file-reading
description: High-speed cached directory discovery, file extraction, and regex search using 03-ai-scripts/17-fast-file-reader.py
---

# Fast File Reading Skill

Leverages `03-ai-scripts/17-fast-file-reader.py` with 2-tier caching:

1. **Listing Directory:**
   ```bash
   python 03-ai-scripts/17-fast-file-reader.py --list-folder <folder> [--ext .md,.ts]
   ```
2. **Reading File:**
   ```bash
   python 03-ai-scripts/17-fast-file-reader.py --read-file <path> [--max-bytes N]
   ```
3. **Regex Search:**
   ```bash
   python 03-ai-scripts/17-fast-file-reader.py --search-pattern "<pattern>" [--path <dir>]
   ```
