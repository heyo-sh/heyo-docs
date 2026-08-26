const PROJECT_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/i;

export function projectNameError(value: string): string | undefined {
  if (!value.trim()) return "Enter a project name.";
  if (!PROJECT_NAME_PATTERN.test(value))
    return "Use letters, numbers and hyphens only.";
}

export function assertProjectName(value: string): string {
  const error = projectNameError(value);
  if (error) throw new Error(error);
  return value.trim();
}
