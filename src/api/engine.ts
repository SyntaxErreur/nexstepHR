// ============================================================
// Deterministic Output Engine
// Computes weights and materiality from context selections
// ============================================================
import type { CAPOutput, CAPParameter, ContextSelection } from '@/types';
import { db } from './store';
import { generateId } from '@/lib/utils';

export function computeOutputs(capId: string, selections: ContextSelection[]): CAPOutput {
  const baseModel = db.getBaseModel();
  const rules = db.getMultiplierRules();
  const settings = db.getPlatformSettings();

  // Start with base weights
  const weightMap: Record<string, number> = {};
  baseModel.weights.forEach(w => {
    weightMap[w.key] = w.baseWeight;
  });

  // Apply multipliers for each context selection
  selections.forEach(sel => {
    const matchingRules = rules.filter(
      r => r.categoryId === sel.categoryId && r.valueId === sel.valueId
    );
    matchingRules.forEach(rule => {
      if (weightMap[rule.dimensionKey] !== undefined) {
        weightMap[rule.dimensionKey] *= rule.multiplier;
      }
    });
  });

  // Normalize to 100%
  const totalRaw = Object.values(weightMap).reduce((s, v) => s + v, 0);
  const parameters: CAPParameter[] = baseModel.weights.map(w => {
    const normalizedWeight = Number(((weightMap[w.key] / totalRaw) * 100).toFixed(2));
    let materialityLevel: 'High' | 'Medium' | 'Low';
    if (normalizedWeight >= settings.materialityThresholds.high) {
      materialityLevel = 'High';
    } else if (normalizedWeight >= settings.materialityThresholds.medium) {
      materialityLevel = 'Medium';
    } else {
      materialityLevel = 'Low';
    }
    return {
      key: w.key,
      label: w.label,
      weightPct: normalizedWeight,
      materialityLevel,
    };
  });

  const materialitySummary = {
    high: parameters.filter(p => p.materialityLevel === 'High').length,
    medium: parameters.filter(p => p.materialityLevel === 'Medium').length,
    low: parameters.filter(p => p.materialityLevel === 'Low').length,
  };

  return {
    id: generateId(),
    capId,
    parameters,
    materialitySummary,
    computedAt: new Date().toISOString(),
    computedBy: 'system',
  };
}

export function computeSubmissionScores(
  answers: { questionId: string; value: number | string | boolean }[],
  questions: { id: string; dimensionKey: string; weight: number }[]
): { dimensionKey: string; score: number }[] {
  const dimMap: Record<string, { total: number; weight: number }> = {};

  answers.forEach(ans => {
    const q = questions.find(q => q.id === ans.questionId);
    if (!q || typeof ans.value !== 'number') return;
    if (!dimMap[q.dimensionKey]) {
      dimMap[q.dimensionKey] = { total: 0, weight: 0 };
    }
    dimMap[q.dimensionKey].total += (ans.value as number) * q.weight;
    dimMap[q.dimensionKey].weight += q.weight;
  });

  return Object.entries(dimMap).map(([key, val]) => ({
    dimensionKey: key,
    score: val.weight > 0 ? Math.round((val.total / val.weight / 5) * 100) : 50,
  }));
}

export function generateRecommendations(
  parameters: CAPParameter[],
  avgScores: Record<string, number>
): string[] {
  const recommendations: string[] = [];
  const sorted = [...parameters].sort((a, b) => b.weightPct - a.weightPct);

  sorted.forEach(param => {
    const score = avgScores[param.key] || 50;
    if (param.materialityLevel === 'High' && score < 60) {
      recommendations.push(
        `Critical: ${param.label} has high materiality (${param.weightPct}%) but low assessment score (${score}/100). Immediate intervention recommended. Consider engaging specialized consultants and implementing structured improvement programs.`
      );
    } else if (param.materialityLevel === 'High' && score < 75) {
      recommendations.push(
        `Priority: ${param.label} is highly material (${param.weightPct}%) with moderate scores (${score}/100). Develop a targeted improvement plan within the next quarter to strengthen this dimension.`
      );
    } else if (param.materialityLevel === 'High') {
      recommendations.push(
        `Maintain: ${param.label} is highly material (${param.weightPct}%) and performing well (${score}/100). Continue current practices and monitor for any regression.`
      );
    } else if (param.materialityLevel === 'Medium' && score < 50) {
      recommendations.push(
        `Attention: ${param.label} shows below-average scores (${score}/100) at medium materiality. Schedule a review to identify quick wins and structural improvements.`
      );
    }
  });

  if (recommendations.length === 0) {
    recommendations.push(
      'Overall assessment indicates strong alignment between materiality and organizational performance. Continue monitoring key dimensions and address any emerging gaps proactively.'
    );
  }

  return recommendations;
}
