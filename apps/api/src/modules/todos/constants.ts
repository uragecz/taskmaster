import type { Category } from "../../entities/Todo";

export interface CategoryMeta {
  id: Category;
  label: string;
  color: string;
}

/** UI metadata for categories — static reference data returned with the list. */
export const CATEGORIES_META: CategoryMeta[] = [
  { id: "personal", label: "Personal", color: "#8b5cf6" },
  { id: "work", label: "Work", color: "#3b82f6" },
  { id: "shopping", label: "Shopping", color: "#10b981" },
  { id: "health", label: "Health", color: "#ef4444" },
  { id: "other", label: "Other", color: "#6b7280" },
];
