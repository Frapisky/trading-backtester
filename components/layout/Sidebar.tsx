import Link from "next/link";

type SidebarItem = {
  label: string;
  href: string;
};

const ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Backtest", href: "/backtest" },
  { label: "History", href: "/history" },
  { label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-full flex-col">
      <div className="px-4 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-semibold tracking-tight text-zinc-100 hover:bg-white/5"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs font-bold">
            B
          </span>
          Backtester
        </Link>
      </div>

      <nav className="px-2">
        <div className="space-y-1">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="mt-auto px-4 py-4 text-xs text-zinc-500">
        v0 • App shell
      </div>
    </aside>
  );
}

