export function serializeAssessmentHistory(analyses) {
  return analyses.map(({ assessment, ...analysis }) => ({ ...analysis, assessment }));
}
