import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import Layout from '@/components/Layout';

const NotFound: React.FC = () => {
  return (
    <Layout>
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15" />
          <div className="absolute left-1/2 top-1/2 h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[80px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-xl px-4 text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
            404
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">
            This page isn&apos;t part of Baraza.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            The page you&apos;re looking for may have moved or never existed.
            Head back to explore Community DAOs or start your own.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/" className="btn-warm inline-flex items-center gap-2 text-sm">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
            <Link
              to="/communities"
              className="btn-ghost inline-flex items-center gap-2 text-sm"
            >
              <Compass className="h-4 w-4" />
              Browse DAOs
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default NotFound;
