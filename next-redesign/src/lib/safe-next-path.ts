const fallbackDestination = "/";

export function getSafeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallbackDestination;
  }

  if (value.startsWith("/login") || value.includes("\\")) {
    return fallbackDestination;
  }

  return value;
}
