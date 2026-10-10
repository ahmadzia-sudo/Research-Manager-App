import Link from "next/link";
import { loadData } from "@/lib/data";
import { authorName, money, poolSummary } from "@/lib/derive";

export default async function FundingPage() {
  const { projects, authors } = await loadData();
  const authorById = new Map(authors.map((a) => [a.id, a]));
  const withMoney = projects
    .map((p) => ({ p, s: poolSummary(p) }))
    .filter(({ p }) => p.pool.contributions.length || p.pool.payments.length);

  const byCurrency = new Map<string, { contributed: number; apc: number; other: number; toAuthors: number; balance: number }>();
  const perAuthor = new Map<string, Map<string, { contributed: number; received: number }>>();
  for (const { s } of withMoney) {
    const t = byCurrency.get(s.currency) ?? { contributed: 0, apc: 0, other: 0, toAuthors: 0, balance: 0 };
    t.contributed += s.contributed;
    t.apc += s.apc;
    t.other += s.other;
    t.toAuthors += s.toAuthors;
    t.balance += s.balance;
    byCurrency.set(s.currency, t);
    for (const [id, v] of s.perAuthor) {
      const m = perAuthor.get(id) ?? new Map();
      const e = m.get(s.currency) ?? { contributed: 0, received: 0 };
      e.contributed += v.contributed;
      e.received += v.received;
      m.set(s.currency, e);
      perAuthor.set(id, m);
    }
  }
  const authorRows = [...perAuthor.entries()]
    .flatMap(([id, m]) => [...m.entries()].map(([cur, v]) => ({ id, name: authorName(authorById.get(id)), cur, ...v })))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="link text-sm">
          Dashboard
        </Link>
        <h1 className="mt-2 text-3xl font-semibold">Funding</h1>
        <p className="mt-1 text-muted">Internal pools across your projects: what came in, what went to APCs, and what was paid back to authors.</p>
      </div>

      {byCurrency.size === 0 ? (
        <div className="panel">
          <p className="empty">No money recorded yet. Open a project and use its internal funding pool.</p>
        </div>
      ) : (
        [...byCurrency.entries()].map(([cur, t]) => (
          <dl key={cur} className="tabular grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ["Collected", t.contributed],
              ["Paid as APC", t.apc],
              ["Other expenses", t.other],
              ["Paid to authors", t.toAuthors],
              ["Left in pools", t.balance],
            ].map(([label, v]) => (
              <div key={label as string} className={`panel p-4 ${label === "Left in pools" ? "bg-accent-soft" : ""}`}>
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="mt-1 font-serif text-2xl font-semibold">{money(v as number, cur)}</dd>
              </div>
            ))}
          </dl>
        ))
      )}

      {withMoney.length > 0 && (
        <section className="panel overflow-x-auto">
          <div className="panel-head">
            <h2>By project</h2>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Project</th>
                <th className="text-right">Collected</th>
                <th className="text-right">APC</th>
                <th className="text-right">Other</th>
                <th className="text-right">To authors</th>
                <th className="text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {withMoney.map(({ p, s }) => (
                <tr key={p.id}>
                  <td className="max-w-sm">
                    <Link className="link" href={`/projects/${p.id}#pool`}>
                      {p.title || "Untitled project"}
                    </Link>
                  </td>
                  <td className="text-right whitespace-nowrap">{money(s.contributed, s.currency)}</td>
                  <td className="text-right whitespace-nowrap">{money(s.apc, s.currency)}</td>
                  <td className="text-right whitespace-nowrap">{money(s.other, s.currency)}</td>
                  <td className="text-right whitespace-nowrap">{money(s.toAuthors, s.currency)}</td>
                  <td className={`text-right font-semibold whitespace-nowrap ${s.balance < 0 ? "text-danger" : ""}`}>{money(s.balance, s.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {authorRows.length > 0 && (
        <section className="panel overflow-x-auto">
          <div className="panel-head">
            <h2>By author</h2>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Author</th>
                <th className="text-right">Put in</th>
                <th className="text-right">Received</th>
                <th className="text-right">Net</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {authorRows.map((r) => (
                <tr key={r.id + r.cur}>
                  <td>
                    <Link href={`/authors/${r.id}`} className="link">
                      {r.name}
                    </Link>
                  </td>
                  <td className="text-right whitespace-nowrap">{money(r.contributed, r.cur)}</td>
                  <td className="text-right whitespace-nowrap">{money(r.received, r.cur)}</td>
                  <td className="text-right whitespace-nowrap">{money(r.received - r.contributed, r.cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
