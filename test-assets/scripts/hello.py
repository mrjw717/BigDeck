#!/usr/bin/env python3
"""BigDeck "run script" test — python.

Appends a timestamped line to ran.log next to this file (BigDeck runs
scripts detached with stdout discarded, so the log is the proof).
"""

import datetime
import os
import sys

here = os.path.dirname(os.path.abspath(__file__))
stamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

with open(os.path.join(here, "ran.log"), "a", encoding="utf-8") as f:
    f.write(f"{stamp} | python | pid={os.getpid()} | args: {sys.argv[1:]}\n")

print("hello from BigDeck (python) — logged to ran.log")
