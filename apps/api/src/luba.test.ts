import { describe, expect, it } from 'vitest';
describe('lowest unique rule', () => {
  it('selects the smallest frequency of one', () => {
    const frequencies = new Map([[100,2],[200,1],[300,1]]);
    expect([...frequencies.keys()].sort((a,b)=>a-b).find(x => frequencies.get(x) === 1)).toBe(200);
  });
});
