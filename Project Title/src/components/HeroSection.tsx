import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Shield, TrendingUp } from 'lucide-react';

const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 -left-32 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-20 -right-32 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-soft-blue/3 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-medium text-secondary">Community-powered decisions</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6"
          >
            <span className="text-foreground">Your community,</span>
            <br />
            <span className="text-gradient-primary">your decisions</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            Baraza brings your group together. Collect membership fees, propose ideas, 
            vote on how to spend your funds, and see every shilling accounted for.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/create" className="btn-warm text-base px-8 py-3 flex items-center gap-2">
              Start Your Group
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/communities" className="btn-ghost text-base px-8 py-3">
              Browse Communities
            </Link>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto"
        >
          {[
            { icon: Users, label: 'Active Members', value: '2,400+', color: 'text-primary' },
            { icon: Shield, label: 'Communities', value: '180+', color: 'text-accent' },
            { icon: TrendingUp, label: 'Funds Managed', value: 'KSh 12M+', color: 'text-secondary' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="baraza-card p-5 flex flex-col items-center text-center"
            >
              <stat.icon className={`w-6 h-6 mb-2 ${stat.color}`} />
              <span className="font-display text-2xl font-bold text-foreground">{stat.value}</span>
              <span className="text-xs text-muted-foreground mt-1">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
