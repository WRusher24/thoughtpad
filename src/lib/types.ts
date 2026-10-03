import type { FontStyle } from "@/lib/palette";

/** Serializable DTOs shared between server loaders/actions and client UI. */

export interface DrawerDTO {
  id: string;
  name: string;
  color: string;
  icon: string;
  isSystem: boolean;
  createdAt: string;
  thoughtCount: number;
}

export interface ThoughtDTO {
  id: string;
  content: string;
  isTask: boolean;
  drawerId: string | null;
  drawer: { id: string; name: string; color: string; icon: string } | null;
  completedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AppView = "stream" | "archive" | "trash" | "drawers" | "settings";

export interface InitialData {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    createdAt: string;
  };
  fontStyle: FontStyle;
  drawers: DrawerDTO[];
  thoughts: ThoughtDTO[];
  counts: {
    stream: number;
    archive: number;
    trash: number;
  };
}

export const PAGE_SIZE = 30;
