export interface Skill {
  name: string;
  // Add other properties as needed
}

export type SkillNames = string; // or keyof typeof SKILLS

export const SKILLS: Record<string, Skill> = {
  // Add your skills here, e.g.
  // javascript: { name: "JavaScript" },
  // react: { name: "React" },
  // Add more as needed
};