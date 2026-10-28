export function getRoadmapTaskKey(week, weekIndex, taskIndex) {
  const weekNumber = Number.isInteger(week?.week) ? week.week : weekIndex + 1;
  return `week-${weekNumber}:item-${weekIndex}:task-${taskIndex}`;
}

export function normalizeCompletedTasks(roadmap, completedTasks) {
  const completed = new Set(Array.isArray(completedTasks) ? completedTasks : []);
  const normalized = new Set();

  (Array.isArray(roadmap) ? roadmap : []).forEach((week, weekIndex) => {
    const tasks = Array.isArray(week?.tasks) ? week.tasks : [];
    tasks.forEach((task, taskIndex) => {
      const taskKey = getRoadmapTaskKey(week, weekIndex, taskIndex);
      const legacyKey = `week-${week?.week ?? weekIndex}:${task}`;
      if (completed.has(taskKey) || completed.has(legacyKey)) normalized.add(taskKey);
    });
  });

  return [...normalized];
}

export function summarizeRoadmap(roadmap, completedTasks) {
  const tasks = (Array.isArray(roadmap) ? roadmap : []).flatMap((week, weekIndex) => {
    const weekTasks = Array.isArray(week?.tasks) ? week.tasks : [];
    return weekTasks.map((task, taskIndex) => ({
      key: getRoadmapTaskKey(week, weekIndex, taskIndex),
      weekIndex,
      week: week?.week ?? weekIndex + 1,
      theme: typeof week?.theme === 'string' ? week.theme : '',
      title: typeof task === 'string' ? task : task?.title || task?.name || 'Roadmap task',
      description: typeof task === 'object' && task !== null && typeof task.description === 'string'
        ? task.description
        : ''
    }));
  });
  const completed = new Set(normalizeCompletedTasks(roadmap, completedTasks));
  const completedCount = tasks.filter(({ key }) => completed.has(key)).length;

  return {
    tasks,
    completedCount,
    remainingCount: tasks.length - completedCount,
    totalCount: tasks.length,
    percentage: tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0
  };
}

export function getRoadmapCards(history) {
  return (Array.isArray(history) ? history : [])
    .filter((record) => record && typeof record._id === 'string' && record._id.length > 0)
    .map((record) => ({
      id: record._id,
      route: `/dashboard/assessments/${encodeURIComponent(record._id)}`,
      title: record.assessment?.targetCareer || record.suggestedPaths?.[0]?.title || 'Career roadmap',
      createdAt: record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'Date unavailable',
      skillGapCount: Array.isArray(record.skillGaps) ? record.skillGaps.length : 0,
      projectCount: Array.isArray(record.projects) ? record.projects.length : 0,
      readiness: typeof record.readiness?.score === 'number' ? record.readiness.score : null
    }));
}
