import { getDb } from '../db';
import type { Calibration, RecommendationOverride, Dimension, Recommendation } from '../types';

export function insertCalibration(data: {
  role_id: number;
  dimension: Dimension;
  ai_score: number;
  my_score: number;
  reason: string;
}): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO calibrations (role_id, dimension, ai_score, my_score, reason)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.role_id, data.dimension, data.ai_score, data.my_score, data.reason);
  return result.lastInsertRowid as number;
}

export function insertRecommendationOverride(data: {
  role_id: number;
  ai_recommendation: Recommendation;
  my_recommendation: Recommendation;
  reason: string;
}): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO recommendation_overrides (role_id, ai_recommendation, my_recommendation, reason)
    VALUES (?, ?, ?, ?)
  `).run(data.role_id, data.ai_recommendation, data.my_recommendation, data.reason);
  return result.lastInsertRowid as number;
}

export function getRecentCalibrations(limit: number = 10): (Calibration & { title: string; company: string })[] {
  const db = getDb();
  return db.prepare(`
    SELECT c.*, r.title, r.company
    FROM calibrations c
    JOIN roles r ON r.id = c.role_id
    ORDER BY c.created_at DESC
    LIMIT ?
  `).all(limit) as (Calibration & { title: string; company: string })[];
}

export function getRecentRecommendationOverrides(limit: number = 5): (RecommendationOverride & { title: string; company: string })[] {
  const db = getDb();
  return db.prepare(`
    SELECT ro.*, r.title, r.company
    FROM recommendation_overrides ro
    JOIN roles r ON r.id = ro.role_id
    ORDER BY ro.created_at DESC
    LIMIT ?
  `).all(limit) as (RecommendationOverride & { title: string; company: string })[];
}

export function getAllCalibrations(): (Calibration & { title: string; company: string })[] {
  const db = getDb();
  return db.prepare(`
    SELECT c.*, r.title, r.company
    FROM calibrations c
    JOIN roles r ON r.id = c.role_id
    ORDER BY c.created_at DESC
  `).all() as (Calibration & { title: string; company: string })[];
}

export function getCalibrationsByRole(roleId: number): Calibration[] {
  const db = getDb();
  return db.prepare('SELECT * FROM calibrations WHERE role_id = ? ORDER BY created_at DESC').all(roleId) as Calibration[];
}
