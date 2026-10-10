// Turns any incoming object into a complete, clean record. Safe on client and server.
import type {
  Affiliation,
  Author,
  Contribution,
  EventType,
  ExtraCharge,
  FundingPool,
  FundingStatement,
  Journal,
  Payment,
  Project,
  ProjectAuthor,
  Submission,
  SubmissionEvent,
  Task,
} from "./types";
import { EVENT_LABELS } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = Record<string, any>;

export const newId = () =>
  (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(
    /-/g,
    ""
  ).slice(0, 16);

const s = (v: unknown, max = 20000) => (typeof v === "string" ? v.trim().slice(0, max) : v == null ? "" : String(v).trim().slice(0, max));
const b = (v: unknown) => v === true || v === "true";
const n = (v: unknown) => {
  const x = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(x) ? Math.round(x * 100) / 100 : 0;
};
const arr = (v: unknown): Any[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : []);
const strs = (v: unknown) => (Array.isArray(v) ? v.map((x) => s(x, 200)).filter(Boolean) : []);
const date = (v: unknown) => {
  const t = s(v, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : "";
};

export function normAffiliation(a: Any): Affiliation {
  return {
    id: s(a.id, 40) || newId(),
    department: s(a.department, 300),
    institution: s(a.institution, 300),
    city: s(a.city, 120),
    postalCode: s(a.postalCode, 40),
    country: s(a.country, 120),
  };
}

export function normAuthor(a: Any, existing?: Author): Author {
  const now = new Date().toISOString();
  const fullName = s(a.fullName, 300) || [s(a.givenName), s(a.familyName)].filter(Boolean).join(" ");
  return {
    id: existing?.id ?? (s(a.id, 40) || newId()),
    fullName,
    givenName: s(a.givenName, 200),
    familyName: s(a.familyName, 200),
    title: s(a.title, 40),
    designation: s(a.designation, 200),
    email: s(a.email, 200).toLowerCase(),
    altEmail: s(a.altEmail, 200).toLowerCase(),
    orcid: s(a.orcid, 40).replace(/^https?:\/\/orcid\.org\//i, ""),
    phone: s(a.phone, 60),
    scopusId: s(a.scopusId, 60),
    googleScholar: s(a.googleScholar, 500),
    website: s(a.website, 500),
    affiliations: arr(a.affiliations).map(normAffiliation),
    notes: s(a.notes),
    createdAt: existing?.createdAt ?? (s(a.createdAt) || now),
    updatedAt: now,
    createdBy: existing?.createdBy ?? s(a.createdBy, 40),
  };
}

export function normJournal(j: Any, existing?: Journal): Journal {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? (s(j.id, 40) || newId()),
    name: s(j.name, 400),
    alias: s(j.alias, 60),
    publisher: s(j.publisher, 200),
    issnPrint: s(j.issnPrint, 20),
    issnOnline: s(j.issnOnline, 20),
    scopusQuartile: s(j.scopusQuartile, 10),
    jcrQuartile: s(j.jcrQuartile, 10),
    impactFactor: s(j.impactFactor, 20),
    citeScore: s(j.citeScore, 20),
    url: s(j.url, 1000),
    scimagoUrl: s(j.scimagoUrl, 1000),
    submissionUrl: s(j.submissionUrl, 1000),
    apcAmount: s(j.apcAmount, 40),
    apcCurrency: s(j.apcCurrency, 10) || "USD",
    extraCharges: arr(j.extraCharges).map(
      (c): ExtraCharge => ({ id: s(c.id, 40) || newId(), label: s(c.label, 200), amount: s(c.amount, 40) })
    ),
    hasWordTemplate: b(j.hasWordTemplate),
    hasLatexTemplate: b(j.hasLatexTemplate),
    wordTemplateUrl: s(j.wordTemplateUrl, 1000),
    latexTemplateUrl: s(j.latexTemplateUrl, 1000),
    notes: s(j.notes),
    createdAt: existing?.createdAt ?? (s(j.createdAt) || now),
    updatedAt: now,
    createdBy: existing?.createdBy ?? s(j.createdBy, 40),
  };
}

const EVENT_TYPES = Object.keys(EVENT_LABELS) as EventType[];

function normEvent(e: Any): SubmissionEvent {
  const type = EVENT_TYPES.includes(e.type) ? (e.type as EventType) : "submitted";
  return { id: s(e.id, 40) || newId(), type, date: date(e.date), note: s(e.note, 2000) };
}

function normSubmission(x: Any): Submission {
  return {
    id: s(x.id, 40) || newId(),
    journalId: s(x.journalId, 40),
    manuscriptId: s(x.manuscriptId, 100),
    doi: s(x.doi, 200),
    articleUrl: s(x.articleUrl, 1000),
    notes: s(x.notes),
    events: arr(x.events).map(normEvent),
    createdAt: s(x.createdAt) || new Date().toISOString(),
  };
}

function normProjectAuthor(x: Any): ProjectAuthor {
  return {
    authorId: s(x.authorId, 40),
    affiliationIds: strs(x.affiliationIds),
    corresponding: b(x.corresponding),
    equalContribution: b(x.equalContribution),
    creditRoles: strs(x.creditRoles),
    note: s(x.note, 2000),
  };
}

function normStatement(x: Any): FundingStatement {
  return {
    id: s(x.id, 40) || newId(),
    funder: s(x.funder, 400),
    grantNumber: s(x.grantNumber, 200),
    recipientAuthorIds: strs(x.recipientAuthorIds),
    declare: x.declare === undefined ? true : b(x.declare),
    note: s(x.note, 2000),
  };
}

function normPool(x: Any | undefined): FundingPool {
  const p = x && typeof x === "object" ? x : {};
  return {
    currency: s(p.currency, 10) || "PKR",
    contributions: arr(p.contributions).map(
      (c): Contribution => ({
        id: s(c.id, 40) || newId(),
        authorId: s(c.authorId, 40),
        amount: n(c.amount),
        date: date(c.date),
        note: s(c.note, 2000),
      })
    ),
    payments: arr(p.payments).map(
      (c): Payment => ({
        id: s(c.id, 40) || newId(),
        kind: c.kind === "apc" || c.kind === "author" ? c.kind : "other",
        authorId: s(c.authorId, 40),
        submissionId: s(c.submissionId, 40),
        amount: n(c.amount),
        date: date(c.date),
        note: s(c.note, 2000),
      })
    ),
  };
}

function normTask(x: Any): Task {
  return {
    id: s(x.id, 40) || newId(),
    text: s(x.text, 2000),
    from: s(x.from, 200),
    status: x.status === "done" ? "done" : "open",
    due: date(x.due),
    createdAt: s(x.createdAt) || new Date().toISOString(),
    doneAt: s(x.doneAt),
  };
}

export const PROJECT_EDITABLE = [
  "title",
  "abstract",
  "keywords",
  "notes",
  "authors",
  "submissions",
  "fundingStatements",
  "pool",
  "tasks",
  "contributorIds",
] as const;

export function normProject(p: Any): Project {
  const now = new Date().toISOString();
  return {
    id: s(p.id, 40) || newId(),
    title: s(p.title, 1000),
    abstract: s(p.abstract, 20000),
    keywords: s(p.keywords, 2000),
    notes: s(p.notes),
    ownerId: s(p.ownerId, 40),
    contributorIds: strs(p.contributorIds),
    authors: arr(p.authors).map(normProjectAuthor).filter((a) => a.authorId),
    submissions: arr(p.submissions).map(normSubmission),
    fundingStatements: arr(p.fundingStatements).map(normStatement),
    pool: normPool(p.pool),
    tasks: arr(p.tasks).map(normTask),
    createdAt: s(p.createdAt) || now,
    updatedAt: s(p.updatedAt) || now,
  };
}
