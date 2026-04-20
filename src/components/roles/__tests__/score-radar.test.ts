import { describe, it, expect } from 'vitest';
import { RADAR_DIMS, RADAR_MAX, radarPoint } from '../score-radar';

describe('RADAR_DIMS', () => {
  it('has the canonical six dimensions in order', () => {
    expect(RADAR_DIMS).toEqual(['want', 'can', 'grow', 'pay', 'team', 'impact']);
  });
});

describe('radarPoint', () => {
  const R = 100;
  const CX = 120;
  const CY = 120;

  it('returns the center when score is 0', () => {
    const [x, y] = radarPoint(0, 0, R, CX, CY);
    expect(x).toBeCloseTo(CX);
    expect(y).toBeCloseTo(CY);
  });

  it('places axis 0 at 12 o’clock (directly above center at max score)', () => {
    const [x, y] = radarPoint(0, RADAR_MAX, R, CX, CY);
    expect(x).toBeCloseTo(CX);
    expect(y).toBeCloseTo(CY - R);
  });

  it('places axis 3 at 6 o’clock (directly below center at max score)', () => {
    const [x, y] = radarPoint(3, RADAR_MAX, R, CX, CY);
    expect(x).toBeCloseTo(CX);
    expect(y).toBeCloseTo(CY + R);
  });

  it('spaces axes 60 degrees apart (axes 1 and 5 mirror across x = CX)', () => {
    const [x1] = radarPoint(1, RADAR_MAX, R, CX, CY);
    const [x5] = radarPoint(5, RADAR_MAX, R, CX, CY);
    expect(x1 + x5).toBeCloseTo(2 * CX);
  });

  it('spaces axes 60 degrees apart (axes 2 and 4 mirror across x = CX)', () => {
    const [x2] = radarPoint(2, RADAR_MAX, R, CX, CY);
    const [x4] = radarPoint(4, RADAR_MAX, R, CX, CY);
    expect(x2 + x4).toBeCloseTo(2 * CX);
  });

  it('scales radial distance linearly with score', () => {
    const d1 = Math.abs(radarPoint(0, 1, R, CX, CY)[1] - CY);
    const d2 = Math.abs(radarPoint(0, 2, R, CX, CY)[1] - CY);
    const d3 = Math.abs(radarPoint(0, 3, R, CX, CY)[1] - CY);
    expect(d2).toBeCloseTo(2 * d1);
    expect(d3).toBeCloseTo(3 * d1);
  });

  it('axes 1 and 2 produce points to the right of the axis 0', () => {
    const [x1] = radarPoint(1, RADAR_MAX, R, CX, CY);
    const [x2] = radarPoint(2, RADAR_MAX, R, CX, CY);
    expect(x1).toBeGreaterThan(CX);
    expect(x2).toBeGreaterThan(CX);
  });

  it('axes 4 and 5 produce points to the left of the axis 0', () => {
    const [x4] = radarPoint(4, RADAR_MAX, R, CX, CY);
    const [x5] = radarPoint(5, RADAR_MAX, R, CX, CY);
    expect(x4).toBeLessThan(CX);
    expect(x5).toBeLessThan(CX);
  });
});
