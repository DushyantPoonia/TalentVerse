function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function loadDashboardData({ getUser, getHistory, getProfile }) {
  const [userResult, historyResult, profileResult] = await Promise.allSettled([
    Promise.resolve().then(getUser),
    Promise.resolve().then(getHistory),
    Promise.resolve().then(getProfile)
  ]);
  const errors = {
    user: userResult.status === 'rejected' ? userResult.reason : null,
    history: historyResult.status === 'rejected' ? historyResult.reason : null,
    profile: profileResult.status === 'rejected' ? profileResult.reason : null
  };

  return {
    user: userResult.status === 'fulfilled' ? userResult.value?.user || null : null,
    history: historyResult.status === 'fulfilled' && Array.isArray(historyResult.value?.assessments)
      ? historyResult.value.assessments
      : [],
    profile: profileResult.status === 'fulfilled' ? profileResult.value?.profile || null : null,
    errors
  };
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
