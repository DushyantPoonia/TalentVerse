export function getRoadmapTaskKey(week, weekIndex, taskIndex) {
  const weekNumber = Number.isInteger(week?.week) ? week.week : weekIndex + 1;
  return `week-${weekNumber}:item-${weekIndex}:task-${taskIndex}`;
}

export function normalizeCompletedTasks(roadmap, completedTasks) {
  if (!Array.isArray(completedTasks)) return null;

  const taskKeys = new Set();
  const legacyKeys = new Map();
  (Array.isArray(roadmap) ? roadmap : []).forEach((week, weekIndex) => {
    const tasks = Array.isArray(week?.tasks) ? week.tasks : [];
    tasks.forEach((task, taskIndex) => {
      const taskKey = getRoadmapTaskKey(week, weekIndex, taskIndex);
      taskKeys.add(taskKey);
      const legacyKey = `week-${week?.week ?? weekIndex}:${task}`;
      legacyKeys.set(legacyKey, [...(legacyKeys.get(legacyKey) || []), taskKey]);
    });
  });

  const normalized = new Set();
  for (const task of completedTasks) {
    if (taskKeys.has(task)) normalized.add(task);
    else if (legacyKeys.has(task)) legacyKeys.get(task).forEach((key) => normalized.add(key));
    else return null;
  }
  return [...normalized];
}
