"use client";

type Props = {
  title: string;
  onOpenSidebar?: () => void;
};

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Header({ title, onOpenSidebar }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/70 backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-200 hover:bg-white/10 md:hidden"
            aria-label="Open sidebar"
          >
            <MenuIcon />
          </button>
          <div className="text-sm font-semibold text-zinc-100">{title}</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-xs text-zinc-400 sm:block">
            Paper account
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-white/20 to-white/5" />
            <div className="text-xs font-medium text-zinc-200">Profile</div>
          </div>
        </div>
      </div>
    </header>
  );
}

