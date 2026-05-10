import React from 'react';
import { motion } from 'framer-motion';
import { Users, Vote, PiggyBank, Eye, MessageCircle, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Create Your Group',
    description: 'Set up your community in minutes. Name it, set a membership fee, and invite your members.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: PiggyBank,
    title: 'Collect & Pool Funds',
    description: 'Members pay their dues directly. Every contribution is tracked and transparent to all.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: Vote,
    title: 'Make Decisions Together',
    description: 'Propose how to use community funds. Every member gets a voice — support or object.',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  {
    icon: Eye,
    title: 'Full Transparency',
    description: 'See exactly where every shilling goes. Fund balance, decisions, and outcomes are visible to all.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Reliable',
    description: 'Your community data and funds are protected with world-class security. No middlemen.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: MessageCircle,
    title: 'Asha, Your Guide',
    description: 'Need help? Asha is always available to answer questions and guide you through the platform.',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
];

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-20 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4"
          >
            Everything your group needs
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-xl mx-auto"
          >
            From collecting dues to making collective decisions — Baraza handles it all.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="baraza-card p-6 group"
            >
              <div className={`w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <h3 className="font-display text-base font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
