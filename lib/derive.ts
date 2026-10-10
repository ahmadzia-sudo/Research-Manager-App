// Calculations used by the dashboard, journal stats and funding pages. Safe on client and server.
import type { Affiliation, Author, Journal, Project, Stage, Submission, SubmissionEvent } from "./types";

/* ---------------- dates ---------------- */

export function daysBetween(a: string, b: string): number | null {
  if (!a || !b) return null;
  const d = (Date.parse(b) - Date.parse(a)) / 86400000;
  return Number.isFinite(d) ? Math.round(d) : null;
}

export function fmtDate(d: string): string {
  if (!d) return "";
  const t = new Date(d.length === 10 ? d + "T00:00:00" : d);
  if (isNaN(t.getTime())) return d;
  return t.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDays(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n < 60) return `${n} d`;
  return `${n} d (${(n / 30.44).toFixed(1)} mo)`;
}

export const today = () => new Date().toISOString().slice(0, 10);

/* ---------------- submissions & stages ---------------- */

export function sortedEvents(sub: Submission): SubmissionEvent[] {
  return [...sub.events].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
}

export function latestEvent(sub: Submission): SubmissionEvent | undefined {
  const ev = sortedEvents(sub);
  return ev[ev.length - 1];
}

export function firstDate(sub: Submission, type: SubmissionEvent["type"]): string {
  return sortedEvents(sub).find((e) => e.type === type)?.date ?? "";
}

export function submissionStage(sub: Submission): Stage | "closed" {
  const last = latestEvent(sub);
  if (!last) return "submitted";
  switch (last.type) {
    case "revision_requested":
      return "revision";
    case "accepted":
      return "accepted";
    case "published":
      return "published";
    case "rejected":
    case "withdrawn":
      return "closed";
    default:
      return "submitted";
  }
}

export function submissionStartDate(sub: Submission): string {
  return firstDate(sub, "submitted") || sortedEvents(sub)[0]?.date || sub.createdAt.slice(0, 10);
}

/** Newest submission first. */
export function sortedSubmissions(p: Project): Submission[] {
  return [...p.submissions].sort((a, b) => submissionStartDate(b).localeCompare(submissionStartDate(a)));
}

export function activeSubmission(p: Project): Submission | undefined {
  return sortedSubmissions(p).find((s) => submissionStage(s) !== "closed");
}

export type DecisionReason = "new" | "resubmit";

export function projectStage(p: Project): { stage: Stage; reason?: DecisionReason; submission?: Submission } {
  const active = activeSubmission(p);
  if (active) return { stage: submissionStage(active) as Stage, submission: active };
  return { stage: "needs-decision", reason: p.submissions.length ? "resubmit" : "new" };
}

export const PIPELINE_ORDER: Stage[] = ["needs-decision", "submitted", "revision", "accepted", "published"];

/* ---------------- journal stats from your own history ---------------- */

export interface JournalStats {
  submissions: number;
  accepted: number;
  published: number;
  rejected: number;
  withdrawn: number;
  pending: number;
  acceptanceRate: number | null;
  firstDecision: Avg;
  toAcceptance: Avg;
  acceptanceToPublication: Avg;
  toPublication: Avg;
  toRejection: Avg;
  rows: {
    projectId: string;
    projectTitle: string;
    submission: Submission;
    submitted: string;
    accepted: string;
    published: string;
    rejected: string;
    status: string;
  }[];
}

export interface Avg {
  avg: number | null;
  min: number | null;
  max: number | null;
  count: number;
}

function avg(values: (number | null)[]): Avg {
  const v = values.filter((x): x is number => x != null && x >= 0);
  if (!v.length) return { avg: null, min: null, max: null, count: 0 };
  return {
    avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length),
    min: Math.min(...v),
    max: Math.max(...v),
    count: v.length,
  };
}

export function journalStats(journalId: string, projects: Project[]): JournalStats {
  const rows: JournalStats["rows"] = [];
  const firstDecision: (number | null)[] = [];
  const toAcc: (number | null)[] = [];
  const accToPub: (number | null)[] = [];
  const toPub: (number | null)[] = [];
  const toRej: (number | null)[] = [];
  let accepted = 0,
    published = 0,
    rejected = 0,
    withdrawn = 0,
    pending = 0;

  for (const p of projects) {
    for (const sub of p.submissions) {
      if (sub.journalId !== journalId) continue;
      const submitted = submissionStartDate(sub);
      const acc = firstDate(sub, "accepted");
      const pub = firstDate(sub, "published");
      const rej = firstDate(sub, "rejected");
      const wd = firstDate(sub, "withdrawn");
      const decision = sortedEvents(sub).find((e) =>
        ["revision_requested", "accepted", "rejected"].includes(e.type)
      )?.date;
      if (acc || pub) accepted++;
      if (pub) published++;
      if (rej) rejected++;
      if (wd && !rej) withdrawn++;
      const stage = submissionStage(sub);
      if (stage === "submitted" || stage === "revision") pending++;
      firstDecision.push(daysBetween(submitted, decision ?? ""));
      toAcc.push(daysBetween(submitted, acc));
      accToPub.push(daysBetween(acc, pub));
      toPub.push(daysBetween(submitted, pub));
      toRej.push(daysBetween(submitted, rej));
      const last = latestEvent(sub);
      rows.push({
        projectId: p.id,
        projectTitle: p.title || "Untitled project",
        submission: sub,
        submitted,
        accepted: acc,
        published: pub,
        rejected: rej,
        status: last ? last.type : "submitted",
      });
    }
  }
  const decided = accepted + rejected;
  return {
    submissions: rows.length,
    accepted,
    published,
    rejected,
    withdrawn,
    pending,
    acceptanceRate: decided ? Math.round((accepted / decided) * 100) : null,
    firstDecision: avg(firstDecision),
    toAcceptance: avg(toAcc),
    acceptanceToPublication: avg(accToPub),
    toPublication: avg(toPub),
    toRejection: avg(toRej),
    rows: rows.sort((a, b) => b.submitted.localeCompare(a.submitted)),
  };
}

/* ---------------- funding ---------------- */

export function poolSummary(p: Project) {
  const contributed = p.pool.contributions.reduce((a, c) => a + c.amount, 0);
  const apc = p.pool.payments.filter((x) => x.kind === "apc").reduce((a, c) => a + c.amount, 0);
  const other = p.pool.payments.filter((x) => x.kind === "other").reduce((a, c) => a + c.amount, 0);
  const toAuthors = p.pool.payments.filter((x) => x.kind === "author").reduce((a, c) => a + c.amount, 0);
  const perAuthor = new Map<string, { contributed: number; received: number }>();
  for (const c of p.pool.contributions) {
    const e = perAuthor.get(c.authorId) ?? { contributed: 0, received: 0 };
    e.contributed += c.amount;
    perAuthor.set(c.authorId, e);
  }
  for (const c of p.pool.payments.filter((x) => x.kind === "author")) {
    const e = perAuthor.get(c.authorId) ?? { contributed: 0, received: 0 };
    e.received += c.amount;
    perAuthor.set(c.authorId, e);
  }
  return {
    currency: p.pool.currency,
    contributed,
    apc,
    other,
    toAuthors,
    balance: contributed - apc - other - toAuthors,
    perAuthor,
  };
}

export function money(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

/* ---------------- author text for papers ---------------- */

export function affiliationText(a: Affiliation): string {
  const cityLine = [a.city, a.postalCode].filter(Boolean).join(" ");
  return [a.department, a.institution, cityLine, a.country].filter(Boolean).join(", ");
}

export function authorName(a: Author | undefined): string {
  if (!a) return "Unknown author";
  return a.fullName || [a.givenName, a.familyName].filter(Boolean).join(" ") || a.email || "Unnamed author";
}

export function primaryAffiliation(a: Author): string {
  return a.affiliations[0] ? affiliationText(a.affiliations[0]) : "";
}

const SUPERS = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
const sup = (n: number) => String(n).split("").map((d) => SUPERS[+d]).join("");

function texEscape(t: string) {
  return t.replace(/([&%$#_{}])/g, "\\$1");
}

/** Build every copy-ready block for the authors of a project. */
export function authorBlocks(p: Project, authors: Author[]) {
  const byId = new Map(authors.map((a) => [a.id, a]));
  const affOrder: string[] = []; // affiliation texts in first-appearance order
  const rows = p.authors.map((pa) => {
    const a = byId.get(pa.authorId);
    const affs = a
      ? (pa.affiliationIds.length
          ? a.affiliations.filter((x) => pa.affiliationIds.includes(x.id))
          : a.affiliations.slice(0, 1)
        ).map(affiliationText)
      : [];
    const nums = affs.map((t) => {
      let i = affOrder.indexOf(t);
      if (i < 0) {
        affOrder.push(t);
        i = affOrder.length - 1;
      }
      return i + 1;
    });
    return { pa, a, name: authorName(a), nums };
  });

  const marks = (r: (typeof rows)[number]) =>
    (r.pa.corresponding ? "*" : "") + (r.pa.equalContribution ? "†" : "");

  const plain = [
    rows.map((r) => `${r.name}${r.nums.map(sup).join(",")}${marks(r)}`).join(", "),
    "",
    ...affOrder.map((t, i) => `${sup(i + 1)} ${t}`),
    ...(rows.some((r) => r.pa.corresponding)
      ? [
          "",
          `* Corresponding author${rows.filter((r) => r.pa.corresponding).length > 1 ? "s" : ""}: ` +
            rows
              .filter((r) => r.pa.corresponding)
              .map((r) => `${r.name}${r.a?.email ? ` (${r.a.email})` : ""}`)
              .join("; "),
        ]
      : []),
    ...(rows.some((r) => r.pa.equalContribution) ? ["† These authors contributed equally to this work."] : []),
  ].join("\n");

  const detailed = rows
    .map((r, i) =>
      [
        `${i + 1}. ${r.name}${r.pa.corresponding ? " (corresponding)" : ""}`,
        ...r.nums.map((n) => `   Affiliation: ${affOrder[n - 1]}`),
        r.a?.email ? `   Email: ${r.a.email}` : "",
        r.a?.orcid ? `   ORCID: https://orcid.org/${r.a.orcid}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n\n");

  const latex = [
    ...rows.map((r) => {
      const opts = r.nums.join(",");
      const extra = [
        r.pa.corresponding ? "\\corref{cor1}" : "",
        r.a?.orcid ? `% ORCID: ${r.a.orcid}` : "",
      ];
      return `\\author[${opts}]{${texEscape(r.name)}}${extra[0]}${r.a?.email ? `\n\\ead{${texEscape(r.a.email)}}` : ""}${extra[1] ? "\n" + extra[1] : ""}`;
    }),
    rows.some((r) => r.pa.corresponding) ? "\\cortext[cor1]{Corresponding author}" : "",
    "",
    ...affOrder.map((t, i) => `\\affiliation[${i + 1}]{organization={${texEscape(t)}}}`),
  ]
    .filter((l, i, all) => !(l === "" && all[i - 1] === ""))
    .join("\n");

  const emails = rows.map((r) => r.a?.email).filter(Boolean).join("; ");
  const orcids = rows
    .filter((r) => r.a?.orcid)
    .map((r) => `${r.name}: https://orcid.org/${r.a!.orcid}`)
    .join("\n");

  const credit = rows
    .filter((r) => r.pa.creditRoles.length)
    .map((r) => `${r.name}: ${r.pa.creditRoles.join(", ")}.`)
    .join(" ");

  return { plain, detailed, latex, emails, orcids, credit, affiliations: affOrder };
}

export function fundingStatementText(p: Project, authors: Author[]): string {
  const byId = new Map(authors.map((a) => [a.id, a]));
  const items = p.fundingStatements.filter((f) => f.declare && (f.funder || f.grantNumber));
  if (!items.length)
    return "This research received no specific grant from any funding agency in the public, commercial, or not-for-profit sectors.";
  const parts = items.map((f) => {
    const who = f.recipientAuthorIds.map((id) => authorName(byId.get(id))).filter(Boolean);
    return `${f.funder || "[funder]"}${f.grantNumber ? ` under Grant No. ${f.grantNumber}` : ""}${
      who.length ? ` (awarded to ${who.join(", ")})` : ""
    }`;
  });
  const joined = parts.length === 1 ? parts[0] : parts.slice(0, -1).join("; ") + "; and " + parts[parts.length - 1];
  return `This work was supported by ${joined}.`;
}

/* ---------------- author search ---------------- */

export function normalizeText(t: string) {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9@.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 3) return 99;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** Score how well an author matches what was typed. 0 = no match. */
export function authorMatchScore(a: Author, query: string): { score: number; emailExact: boolean } {
  const q = normalizeText(query);
  if (!q) return { score: 0, emailExact: false };
  const emails = [a.email, a.altEmail].filter(Boolean).map((e) => e.toLowerCase());
  if (q.includes("@")) {
    if (emails.includes(q)) return { score: 1000, emailExact: true };
    if (emails.some((e) => e.startsWith(q))) return { score: 500, emailExact: false };
    return { score: 0, emailExact: false };
  }
  if (a.orcid && a.orcid.replace(/-/g, "").includes(q.replace(/-/g, "")) && q.length >= 4)
    return { score: 600, emailExact: false };
  const name = normalizeText(authorName(a) + " " + a.givenName + " " + a.familyName);
  if (name.startsWith(q)) return { score: 400, emailExact: false };
  if (name.includes(q)) return { score: 300, emailExact: false };
  const qt = q.split(" ");
  const nt = name.split(" ");
  let score = 0;
  for (const t of qt) {
    if (nt.some((w) => w.startsWith(t))) score += 60;
    else if (t.length >= 3 && nt.some((w) => editDistance(w, t) <= (t.length > 5 ? 2 : 1))) score += 35;
    else if (emails.some((e) => e.includes(t))) score += 30;
  }
  return { score: score >= 35 * qt.length ? score : 0, emailExact: false };
}

export function searchAuthors(authors: Author[], query: string, limit = 8) {
  return authors
    .map((a) => ({ a, ...authorMatchScore(a, query) }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
}

export function journalLabel(j: Journal | undefined): string {
  if (!j) return "Unknown journal";
  return j.alias ? `${j.name} (${j.alias})` : j.name || "Unnamed journal";
}
