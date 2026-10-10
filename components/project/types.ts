import type { Author, Journal, Project, PublicUser } from "@/lib/types";

export interface SectionProps {
  project: Project;
  save: (patch: Partial<Project>) => Promise<void>;
  authors: Author[];
  setAuthors: React.Dispatch<React.SetStateAction<Author[]>>;
  journals: Journal[];
  setJournals: React.Dispatch<React.SetStateAction<Journal[]>>;
  users: PublicUser[];
  me: PublicUser;
  canManage: boolean;
}
