const assignmentListPath = "/list/assignments";

export const getAssignmentReturnHref = (
  value: string | undefined,
  assignmentId: number,
  fallback = `${assignmentListPath}/${assignmentId}`
) => {
  if (!value) return fallback;

  try {
    const baseUrl = "https://assignment-navigation.local";
    const url = new URL(value, baseUrl);

    if (url.origin !== baseUrl || url.pathname !== assignmentListPath) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
};

export const withAssignmentReturnHref = (href: string, returnHref: string) => {
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}returnTo=${encodeURIComponent(returnHref)}`;
};
