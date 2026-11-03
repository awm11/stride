#!/usr/bin/env python3
"""Find on-screen text in a uiautomator dump. Usage:
  smoke-tap.py ui.xml tap "Not now"   -> prints "x y" (centre of the first node with that text)
  smoke-tap.py ui.xml texts           -> prints every visible text, one per line"""
import re, sys, xml.etree.ElementTree as ET
root = ET.parse(sys.argv[1]).getroot()
nodes = [n for n in root.iter('node')]
label = lambda n: (n.get('text') or n.get('content-desc') or '').strip()
if sys.argv[2] == 'texts':
    for n in nodes:
        if label(n): print(label(n))
    sys.exit(0)
want = sys.argv[3].lower()
for n in nodes:
    if label(n).lower() == want:
        x1, y1, x2, y2 = map(int, re.findall(r'\d+', n.get('bounds')))
        print((x1 + x2) // 2, (y1 + y2) // 2); sys.exit(0)
sys.exit(1)
