import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MONITOR } from '../src/config/layout';
import { STAGES, stageFor } from '../src/config/stages';

describe('stages', () => {
  it('have unique ids, and each has a picture or a painter', () => {
    expect(new Set(STAGES.map((s) => s.id)).size).toBe(STAGES.length);
    for (const stage of STAGES) expect(Boolean(stage.image) || Boolean(stage.paint)).toBe(true);
  });

  it('pictures are monitor-sized, and transparent layers have an opaque sky behind them', () => {
    for (const stage of STAGES.filter((s) => s.image)) {
      const png = readFileSync(resolve(__dirname, '../public', stage.image!));
      // PNG header: width and height are the big-endian words at 16 and 20
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([MONITOR.width, MONITOR.height]);
      const transparency = pngChunks(png).get('tRNS');
      const alpha = png[25] === 4 || png[25] === 6 || Boolean(transparency);
      if (alpha) expect(stage.sky).toBeTypeOf('number');
      if (transparency) expect([...transparency].every((value) => value === 0 || value === 255)).toBe(true);
    }
  });

  it('scrolling clouds have a wider native strip and stay below the persistent HUD', () => {
    for (const stage of STAGES) {
      if (!stage.clouds) continue;
      const png = readFileSync(resolve(__dirname, '../public', stage.clouds.image));
      expect(png.readUInt32BE(16)).toBeGreaterThan(MONITOR.width);
      expect(png.readUInt32BE(20)).toBe(stage.clouds.height);
      expect(stage.clouds.y).toBeGreaterThanOrEqual(48);
      expect(Number.isInteger(stage.clouds.y)).toBe(true);
      expect(stage.clouds.stepMs).toBeGreaterThan(0);
      expect(pngChunks(png).has('tRNS') || png[25] === 6).toBe(true);
    }
  });

  it('a seed picks every stage in turn, and ?stage= forces one', () => {
    const ids = STAGES.map((_, i) => stageFor(i + 7).id);
    expect(new Set(ids).size).toBe(STAGES.length);
    expect(stageFor(-1).id).toBe(STAGES[STAGES.length - 1]!.id);
    expect(stageFor(5, STAGES[0]!.id).id).toBe(STAGES[0]!.id);
    expect(stageFor(0, 'nope').id).toBe(STAGES[0]!.id);
  });
});

function pngChunks(png: Buffer): Map<string, Buffer> {
  const chunks = new Map<string, Buffer>();
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    chunks.set(png.toString('ascii', offset + 4, offset + 8), png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  return chunks;
}
