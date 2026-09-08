export type AssignmentInput = {
  enrollmentId: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
};

export function parseAssignmentBody(
  data: Record<string, unknown>
): { value: AssignmentInput } | { errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const enrollmentId = typeof data.enrollmentId === "string" ? data.enrollmentId : "";
  if (!enrollmentId) {
    errors.enrollmentId = "Select a course.";
  }

  const title = typeof data.title === "string" ? data.title.trim() : "";
  if (!title) {
    errors.title = "Title is required.";
  } else if (title.length > 200) {
    errors.title = "Title must be under 200 characters.";
  }

  const description =
    typeof data.description === "string" ? data.description.trim() || null : null;

  let dueDate: Date | null = null;
  if (typeof data.dueDate === "string" && data.dueDate) {
    dueDate = new Date(data.dueDate);
    if (Number.isNaN(dueDate.getTime())) {
      errors.dueDate = "Enter a valid due date.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return { value: { enrollmentId, title, description, dueDate } };
}
