export const careerSkills = {
  'Product Designer': ['visual design', 'user research', 'wireframing', 'prototyping', 'design systems', 'accessibility', 'usability testing', 'communication'],
  'Frontend Developer': ['html & css', 'javascript', 'react', 'responsive design', 'accessibility', 'git', 'testing', 'api integration'],
  'Data Analyst': ['sql', 'spreadsheets', 'data visualization', 'statistics', 'python', 'data cleaning', 'communication', 'dashboard design'],
  'Product Manager': ['product strategy', 'user research', 'roadmapping', 'analytics', 'prioritization', 'communication', 'experimentation', 'stakeholder management'],
  'UX Researcher': ['user research', 'interviewing', 'usability testing', 'research synthesis', 'survey design', 'accessibility', 'communication', 'prototyping'],
  'Marketing Strategist': ['market research', 'content strategy', 'analytics', 'seo', 'campaign planning', 'communication', 'experimentation', 'data visualization']
};

export function getCareerRequirements(career) {
  const exact = careerSkills[career];
  if (exact) return exact;
  return ['role fundamentals', 'communication', 'problem solving', 'practical project work', 'research and analysis', 'collaboration'];
}
