export interface ExperienceStudentAccess {
  user: Record<string, unknown>;
  assignments: Record<string, unknown>[];
  completed: boolean;
  completedAt: Date | null;
}
