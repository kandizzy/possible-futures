import { describe, it, expect } from 'vitest';
import { extractJson } from '@/lib/ai/parse-json';

describe('extractJson', () => {
  it('parses clean JSON', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('strips markdown code fence with json tag', () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('strips markdown code fence without language tag', () => {
    expect(extractJson('```\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('extracts JSON from surrounding prose', () => {
    expect(extractJson('Here is the result: {"a":1} done.')).toEqual({ a: 1 });
  });

  it('handles nested objects', () => {
    const input = '```json\n{"scores":{"want":{"score":3,"rationale":"good"}}}\n```';
    expect(extractJson(input)).toEqual({ scores: { want: { score: 3, rationale: 'good' } } });
  });

  it('handles leading and trailing whitespace', () => {
    expect(extractJson('  \n  {"a":1}  \n  ')).toEqual({ a: 1 });
  });

  it('throws on plain text', () => {
    expect(() => extractJson('This is not JSON')).toThrow('Failed to parse AI response as JSON');
  });

  it('includes preview in error message', () => {
    const longText = 'x'.repeat(250);
    expect(() => extractJson(longText)).toThrow('Response preview:');
  });

  it('handles JSON that starts with {', () => {
    expect(extractJson('{"key":"value"}')).toEqual({ key: 'value' });
  });

  it('strips trailing prose after JSON that starts at position 0', () => {
    const json = '{"scores":{"want":{"score":3,"rationale":"good fit"}}}';
    const withTrailing = json + '\n\nHere is my analysis of the role...';
    expect(extractJson(withTrailing)).toEqual({
      scores: { want: { score: 3, rationale: 'good fit' } },
    });
  });
});
