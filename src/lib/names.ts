/** How the shell greets someone: "Hi, Funmilayo", and the initials in their avatar. */

export function firstNameOf(name: string | null, email: string | null): string {
  const first = name?.trim().split(/\s+/)[0];
  if (first) return first;
  return email?.split("@")[0] || "there";
}

export function initialsOf(name: string | null, email: string | null): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (email?.[0] ?? "C").toUpperCase();
}
