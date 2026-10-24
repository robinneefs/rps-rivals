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

  it('pictures are monitor-sized and opaque', () => {
    for (const stage of STAGES.filter((s) => s.image)) {
      const png = readFileSync(resolve(__dirname, '../public', stage.image!));
      // PNG header: width and height are the big-endian words at 16 and 20
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([MONITOR.width, MONITOR.height]);
      expect(png[25]).toBe(2); // colour type 2: RGB, no alpha
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
