// All data shapes stored in the JSON files on Google Drive.

export type Role = "admin" | "member";

export interface User {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
}

export type PublicUser = Omit<User, "passwordHash">;

export interface Affiliation {
  id: string;
  department: string;
  institution: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Author {
  id: string;
  fullName: string;
  givenName: string;
  familyName: string;
  title: string; // Dr., Prof., Mr., Ms.
  designation: string; // Lecturer, Assistant Professor, PhD Student
  email: string;
  altEmail: string;
  orcid: string;
  phone: string;
  scopusId: string;
  googleScholar: string;
  website: string;
  affiliations: Affiliation[];
  notes: string; // institutional requirements etc.
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ExtraCharge {
  id: string;
  label: string;
  amount: string;
}

export interface Journal {
  id: string;
  name: string;
  alias: string;
  publisher: string;
  issnPrint: string;
  issnOnline: string;
  scopusQuartile: string; // Q1..Q4 or ""
  jcrQuartile: string;
  impactFactor: string;
  citeScore: string;
  url: string;
  scimagoUrl: string;
  submissionUrl: string;
  apcAmount: string;
  apcCurrency: string;
  extraCharges: ExtraCharge[];
  hasWordTemplate: boolean;
  hasLatexTemplate: boolean;
  wordTemplateUrl: string;
  latexTemplateUrl: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export const CREDIT_ROLES = [
  "Conceptualization",
  "Data curation",
  "Formal analysis",
  "Funding acquisition",
  "Investigation",
  "Methodology",
  "Project administration",
  "Resources",
  "Software",
  "Supervision",
  "Validation",
  "Visualization",
  "Writing – original draft",
  "Writing – review & editing",
] as const;

export interface ProjectAuthor {
  authorId: string;
  affiliationIds: string[]; // which of the author's affiliations to print on this paper
  corresponding: boolean;
  equalContribution: boolean;
  creditRoles: string[];
  note: string; // note for this paper only
}

export type EventType =
  | "submitted"
  | "under_review"
  | "revision_requested"
  | "revision_submitted"
  | "accepted"
  | "published"
  | "rejected"
  | "withdrawn";

export const EVENT_LABELS: Record<EventType, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  revision_requested: "Revision requested",
  revision_submitted: "Revision submitted",
  accepted: "Accepted",
  published: "Published",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export interface SubmissionEvent {
  id: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  note: string;
}

export interface Submission {
  id: string;
  journalId: string;
  manuscriptId: string;
  doi: string;
  articleUrl: string;
  notes: string;
  events: SubmissionEvent[];
  createdAt: string;
}

export interface FundingStatement {
  id: string;
  funder: string;
  grantNumber: string;
  recipientAuthorIds: string[];
  declare: boolean; // include in the paper's funding statement
  note: string;
}

export interface Contribution {
  id: string;
  authorId: string;
  amount: number;
  date: string;
  note: string;
}

export type PaymentKind = "apc" | "other" | "author";

export interface Payment {
  id: string;
  kind: PaymentKind;
  authorId: string; // only for kind "author"
  submissionId: string; // optional, for APC
  amount: number;
  date: string;
  note: string;
}

export interface FundingPool {
  currency: string;
  contributions: Contribution[];
  payments: Payment[];
}

export interface Task {
  id: string;
  text: string;
  from: string; // who it is pending from
  status: "open" | "done";
  due: string;
  createdAt: string;
  doneAt: string;
}

export interface Project {
  id: string;
  title: string;
  abstract: string;
  keywords: string;
  notes: string;
  ownerId: string;
  contributorIds: string[];
  authors: ProjectAuthor[];
  submissions: Submission[];
  fundingStatements: FundingStatement[];
  pool: FundingPool;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Collections {
  users: User[];
  authors: Author[];
  journals: Journal[];
  projects: Project[];
}

export type CollectionName = keyof Collections;

export type Stage = "needs-decision" | "submitted" | "revision" | "accepted" | "published";

export const STAGE_LABELS: Record<Stage, string> = {
  "needs-decision": "Needs decision",
  submitted: "Submitted / under review",
  revision: "Under revision",
  accepted: "Accepted",
  published: "Published",
};
