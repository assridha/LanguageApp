"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/deck", label: "Deck", icon: "📚" },
  { href: "/add", label: "Add", icon: "➕" },
  { href: "/practice", label: "Practice", icon: "🔄" },
  { href: "/test", label: "Test", icon: "✏️" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-col bg-stone-50 text-stone-900">
      <header className="hidden border-b border-stone-200 bg-white md:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-orange-600">
            Dutch Flashcards
          </Link>
          <nav className="flex gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-orange-100 text-orange-700"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/focus"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === "/focus"
                  ? "bg-orange-100 text-orange-700"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              Focus
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-8">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-stone-200 bg-white md:hidden">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-11 min-w-11 flex-col items-center justify-center px-2 text-xs ${
                  active ? "text-orange-600" : "text-stone-500"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
