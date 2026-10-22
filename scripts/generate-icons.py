#!/usr/bin/env python3
"""Generate AwayDay PWA icons (dark canvas + amber "A" glyph). No dependencies."""
import math, struct, zlib, os

BG = (0x09, 0x0D, 0x16)
AMBER = (0xFB, 0xBF, 0x24)

# "A" built from three capsule strokes in unit coords. Kept inside the central
# ~60% so it survives maskable-icon cropping.
STROKES = [((0.50, 0.26), (0.32, 0.74)),
           ((0.50, 0.26), (0.68, 0.74)),
           ((0.386, 0.60), (0.614, 0.60))]
HALF_W = 0.052


def dist_seg(px, py, a, b):
    ax, ay = a; bx, by = b
    dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def render(size, ss=3):
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            hit = 0
            for sy in range(ss):
                for sx in range(ss):
                    px = (x + (sx + 0.5) / ss) / size
                    py = (y + (sy + 0.5) / ss) / size
                    if any(dist_seg(px, py, a, b) <= HALF_W for a, b in STROKES):
                        hit += 1
            a = hit / (ss * ss)
            row += bytes(round(BG[i] + (AMBER[i] - BG[i]) * a) for i in range(3))
        rows.append(bytes(row))
    return b"".join(rows)


def write_png(path, size):
    raw = render(size)
    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)
    print("wrote", path, size)


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "..", "public")
    write_png(os.path.join(out, "icon-192.png"), 192)
    write_png(os.path.join(out, "icon-512.png"), 512)
    write_png(os.path.join(out, "apple-touch-icon.png"), 180)
