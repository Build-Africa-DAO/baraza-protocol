import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Layout from '@/components/Layout';

const NotFound: React.FC = () => {
  return (
    <Layout>
      <section className="py-20 flex items-center justify-center min-h-[60vh]">
        <div className="text-center px-4">
          <h1 className="font-display text-6xl font-bold text-gradient-primary mb-4">404</h1>
          <p className="text-lg text-foreground font-medium mb-2">Page not found</p>
          <p className="text-sm text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2 text-sm">
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default NotFound;
