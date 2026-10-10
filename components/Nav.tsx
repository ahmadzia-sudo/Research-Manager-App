"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/authors", label: "Authors" },
  { href: "/journals", label: "Journals" },
  { href: "/funding", label: "Funding" },
  { href: "/settings", label: "Settings" },
];

export function Nav({ name }: { name: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/" ? path === "/" || path.startsWith("/pipeline") : path.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/" className="font-serif text-lg font-semibold">
          Manuscript Desk
        </Link>
        <button className="btn btn-sm" onClick={() => setOpen(!open)} aria-expanded={open}>
          Menu
        </button>
      </header>
      <aside
        className={`${open ? "block" : "hidden"} border-b border-line bg-surface lg:fixed lg:inset-y-0 lg:left-0 lg:block lg:w-56 lg:border-r lg:border-b-0`}
      >
        <div className="flex h-full flex-col p-4">
          <Link href="/" className="hidden px-2 pt-1 pb-6 lg:block">
            <span className="block font-serif text-xl leading-tight font-semibold">Manuscript Desk</span>
            <span className="mt-1 block text-xs text-muted">Papers, people, venues and money</span>
          </Link>
          <nav className="flex flex-col gap-0.5">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 text-[0.92rem] font-medium ${
                  active(l.href) ? "bg-accent-soft text-accent" : "text-ink hover:bg-line-soft"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 border-t border-line-soft pt-4 lg:mt-auto">
            <p className="px-3 text-sm text-muted">Signed in as {name}</p>
            <button
              className="btn btn-ghost btn-sm mt-1"
              onClick={async () => {
                await api("/api/auth/logout", "POST");
                window.location.href = "/login";
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
