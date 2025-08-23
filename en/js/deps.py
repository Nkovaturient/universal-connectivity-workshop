#!/usr/bin/env python3
import sys, shutil
def need(cmd):
    if not shutil.which(cmd):
        print(f"X missing: {cmd}")
        sys.exit(1)
if __name__ == "__main__":
    for cmd in ["node", "npm"]:
        need(cmd)
    print("i deps ok")
    sys.exit(0)
