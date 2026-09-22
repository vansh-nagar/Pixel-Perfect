#!/usr/bin/env python3
"""
Split a reference image (a single piece or a board of tiles) into tiles, save
each one upscaled 3x for close reading, and print each tile's dominant colours.

    python3 .claude/skills/abstract/scripts/study-reference.py board.png --out /tmp/ref
    python3 .claude/skills/abstract/scripts/study-reference.py board.png --cols 3 --rows 4 --out /tmp/ref

Gutters are rows and columns that are mostly the corner pixel's colour. Pass
--cols/--rows when you know the grid: the script then picks the gutter nearest
each expected split, which survives JPEG bleed and dark tiles that sit close to
the gutter colour. Without them it returns every content span it finds.
Needs Pillow (pip install pillow).
"""
import argparse
import os
from collections import Counter

from PIL import Image


def gutter_scores(im, axis, colour, tolerance=6):
    """Per column (axis "x") or row ("y"): the share of pixels that match the gutter colour."""
    w, h = im.size
    px = im.load()
    length, across = (w, h) if axis == "x" else (h, w)
    scores = []
    for i in range(length):
        hits = 0
        for j in range(0, across, 2):
            p = px[i, j] if axis == "x" else px[j, i]
            if all(abs(p[k] - colour[k]) <= tolerance for k in range(3)):
                hits += 1
        scores.append(hits / ((across + 1) // 2))
    return scores


def spans(scores, count, threshold=0.6):
    """Content spans between gutters. With `count`, look for the gutter nearest each even split."""
    content = [i for i, s in enumerate(scores) if s < threshold]
    if not content:
        return []
    lo, hi = content[0], content[-1] + 1
    if not count:
        out, start = [], None
        for i in range(lo, hi + 1):
            gutter = i == hi or scores[i] >= threshold
            if not gutter and start is None:
                start = i
            elif gutter and start is not None:
                if i - start > 8:
                    out.append((start, i))
                start = None
        return out
    cuts = [(lo, lo)]
    window = max(4, (hi - lo) // (count * 8))
    for k in range(1, count):
        expected = lo + (hi - lo) * k // count
        near = [i for i in range(expected - window, expected + window + 1) if scores[i] >= threshold]
        if near:
            # The whole gutter run that sits closest to the expected split.
            centre = min(near, key=lambda i: abs(i - expected))
            a = b = centre
            while a > lo and scores[a - 1] >= threshold:
                a -= 1
            while b < hi - 1 and scores[b + 1] >= threshold:
                b += 1
            cuts.append((a, b + 1))
        else:
            cuts.append((expected, expected))
    cuts.append((hi, hi))
    return [(cuts[i][1], cuts[i + 1][0]) for i in range(count)]


def palette(tile, top=8):
    # Round to steps of 8 so anti-aliasing doesn't split one colour into many.
    counts = Counter((r // 8 * 8, g // 8 * 8, b // 8 * 8) for r, g, b in tile.getdata())
    total = sum(counts.values())
    return [("#%02x%02x%02x" % c, 100 * n / total) for c, n in counts.most_common(top)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("--cols", type=int, default=0)
    ap.add_argument("--rows", type=int, default=0)
    ap.add_argument("--out", default="./reference-tiles")
    args = ap.parse_args()

    im = Image.open(args.image).convert("RGB")
    w, h = im.size
    corner = im.getpixel((0, 0))
    xs = spans(gutter_scores(im, "x", corner), args.cols)
    ys = spans(gutter_scores(im, "y", corner), args.rows)
    if not xs or not ys:
        cols, rows = args.cols or 1, args.rows or 1
        xs = [(w * c // cols, w * (c + 1) // cols) for c in range(cols)]
        ys = [(h * r // rows, h * (r + 1) // rows) for r in range(rows)]
        print(f"no gutters found; split evenly into {cols} x {rows}")
    else:
        print(f"{len(xs)} x {len(ys)} tiles")

    os.makedirs(args.out, exist_ok=True)
    k = 0
    for r, (y0, y1) in enumerate(ys):
        for c, (x0, x1) in enumerate(xs):
            k += 1
            tile = im.crop((x0, y0, x1, y1))
            name = os.path.join(args.out, f"t{k:02d}.png")
            tile.resize((tile.width * 3, tile.height * 3), Image.NEAREST).save(name)
            colours = "  ".join(f"{hexc} {pct:.0f}%" for hexc, pct in palette(tile) if pct >= 0.5)
            print(f"t{k:02d} r{r + 1}c{c + 1} {x1 - x0}x{y1 - y0}  {colours}")


if __name__ == "__main__":
    main()
