import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  Users,
  Home as HomeIcon,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Parivar — Matrimony for the Bunt Community" },
      {
        name: "description",
        content:
          "A trusted, invite-verified matrimony platform exclusively for the Bunt community of coastal Karnataka. Find a life partner within your tradition.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-hero-warm">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <ParivarMark />
          <span className="font-serif text-2xl font-semibold tracking-tight text-primary">
            Parivar
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" className="text-foreground">
              Sign in
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-primary hover:opacity-90">Get started</Button>
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pt-12 md:pt-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-soft bg-card/60 px-3 py-1 text-xs uppercase tracking-widest text-primary">
                <Sparkles className="h-3.5 w-3.5" /> For the Bunt community
              </p>
              <h1 className="font-serif text-5xl leading-[1.05] text-primary md:text-6xl">
                Meet your <span className="text-gold-gradient">life partner</span>
                <br /> within tradition.
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                Parivar is an invite-verified matrimony platform exclusively for the Bunt
                community of coastal Karnataka — thoughtful matches, verified profiles,
                and the warmth of family.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/auth">
                  <Button size="lg" className="bg-primary hover:opacity-90">
                    Create your profile
                  </Button>
                </Link>
                <a href="#how">
                  <Button size="lg" variant="outline" className="border-gold-soft">
                    How it works
                  </Button>
                </a>
              </div>

              {/* Trust bar */}
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-gold-soft pt-6">
                <Stat label="Verified only" value="100%" />
                <Stat label="Community" value="Bunt" />
                <Stat label="Privacy" value="Mutual" />
              </dl>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-gold-soft bg-card shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/60 via-secondary/40 to-primary/20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                  <ParivarMark className="h-16 w-16 text-primary" />
                  <p className="mt-6 font-serif text-2xl text-primary">
                    "Where families meet, and futures begin."
                  </p>
                  <p className="mt-3 text-sm uppercase tracking-widest text-muted-foreground">
                    Kutumba • Sampradaya • Vishwasa
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value props */}
        <section id="how" className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl text-primary md:text-4xl">
              Built for our community
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Every design decision respects the way Bunt families actually meet, evaluate,
              and welcome new members.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {VALUE_PROPS.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-gold-soft bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-xl text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="rounded-3xl border border-gold-soft bg-card/60 p-8 md:p-12">
            <h2 className="font-serif text-3xl text-primary md:text-4xl">
              Three steps to your match
            </h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative rounded-2xl border border-gold-soft bg-background p-6">
                  <span className="absolute -top-4 left-6 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary font-serif text-lg text-primary-foreground shadow-md">
                    {i + 1}
                  </span>
                  <h3 className="mt-2 font-serif text-xl text-primary">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-primary hover:opacity-90">
                  Begin your journey
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-card/40 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Parivar. Built with respect for the Bunt community.
      </footer>
    </div>
  );
}

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: "Admin-verified profiles",
    body: "Every profile is reviewed before it goes live. No fake entries, no strangers — just trusted introductions.",
  },
  {
    icon: HeartHandshake,
    title: "Community-first matching",
    body: "Matches consider bari, gotra, family values and horoscope — the details your family actually asks about.",
  },
  {
    icon: Lock,
    title: "Private by default",
    body: "Full details and photos unlock only when interest is mutual. Your privacy is respected at every step.",
  },
];

const STEPS = [
  {
    title: "Create your profile",
    body: "Share basic details, family background, and preferences. Add photos when you're ready.",
  },
  {
    title: "Discover matches",
    body: "Browse hand-picked recommendations and search by bari, city, and lifestyle.",
  },
  {
    title: "Connect with respect",
    body: "Send interests. When mutual, unlock full details and start a private conversation.",
  },
];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-serif text-2xl text-primary">{value}</dd>
    </div>
  );
}

function ParivarMark({ className = "h-8 w-8 text-primary" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path
        d="M24 4c6 8 12 12 18 14-6 2-12 6-18 26C18 24 12 20 6 18c6-2 12-6 18-14z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="22" r="2.5" fill="currentColor" />
    </svg>
  );
}

// Explicit imports to satisfy the linter if minimizer trims unused;
// keep here in case we add more sections later.
void Users;
void HomeIcon;
