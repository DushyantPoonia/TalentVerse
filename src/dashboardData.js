function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function getLatestAssessment(history) {
  const analysis = Array.isArray(history) ? history.find(isRecord) : null;
  if (!analysis) return null;

  return {
    ...analysis,
    readiness: isRecord(analysis.readiness) ? analysis.readiness : null,
    skillGaps: Array.isArray(analysis.skillGaps) ? analysis.skillGaps.filter(isRecord) : [],
    roadmap: Array.isArray(analysis.roadmap)
      ? analysis.roadmap.filter(isRecord).map((week) => ({
        ...week,
        tasks: Array.isArray(week.tasks) ? week.tasks : []
      }))
      : [],
    projects: Array.isArray(analysis.projects)
      ? analysis.projects.filter(isRecord).map((project) => ({
        ...project,
        skills: Array.isArray(project.skills) ? project.skills : []
      }))
      : []
  };
}
