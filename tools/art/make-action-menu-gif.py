"""Convenience GIF from the six pulse phases captured by capture-home-kit.mjs --action."""
from pathlib import Path
from PIL import Image

folder = Path(__file__).resolve().parents[2] / 'art/menus/action-v1'
frames = [Image.open(folder / 'review-frames' / f'{i:03}.png').convert('RGB').resize(
    (576, 720), Image.Resampling.NEAREST) for i in [0, 2, 3, 5, 6, 7]]
palette = frames[0].quantize(colors=256)
frames = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
frames[0].save(folder / 'animated-review.gif', save_all=True, append_images=frames[1:],
               duration=140, loop=0, optimize=False, disposal=2)
