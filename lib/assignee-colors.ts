export const ASSIGNEE_COLOR_OPTIONS = [
  "#3b82f6",
  "#fb7185",
  "#fbbf24",
  "#60a5fa",
  "#10b981",
  "#8b5cf6",
  "#64748b",
];

export const colorForAssignee = (name: string, colors: Record<string, string> = {}) => {
  const saved = colors[name];
  if (saved) return saved;

  const hash = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0);
  return ASSIGNEE_COLOR_OPTIONS[hash % ASSIGNEE_COLOR_OPTIONS.length];
};

export const initialsForAssignee = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
};
