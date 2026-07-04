"use client";

import * as React from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  Shield,
  FileCheck,
  Lock,
  ChevronRight,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

export default function LandingPage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="flex-1 bg-background text-foreground relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6"
        >
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">Decentralized Security Deposits on Stellar</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring" }}
          className="text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight"
        >
          Smart Rental Deposits <br />
          <span className="bg-gradient-to-r from-primary via-indigo-400 to-sky-400 bg-clip-text text-transparent">
            Without Centralized Escrow
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6"
        >
          RentSure secures rental deposits on Stellar Soroban smart contracts.
          Protecting landlords and tenants with trustless, automated release agreements.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-10"
        >
          <Link href={siteConfig.routes.dashboard}>
            <Button size="lg" className="w-full sm:w-auto flex items-center space-x-2">
              <span>Go to Dashboard</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              How RentSure Works
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-border/40">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Key Platform Features</h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Everything you need for safe lease management in a single decentralized portal.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <motion.div variants={itemVariants}>
            <Card glass className="h-full">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-primary/10 p-3 text-primary w-fit mb-6">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Contract Escrow</h3>
                <p className="text-muted-foreground text-sm">
                  Funds are secured on-chain in autonomous vaults. No third-party intermediaries, no bank holding fees.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card glass className="h-full">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-primary/10 p-3 text-primary w-fit mb-6">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">On-Chain Arbitration</h3>
                <p className="text-muted-foreground text-sm">
                  Disputes are handled through our integrated arbitrator system, ensuring final and fair resolution splits based on lease terms.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card glass className="h-full">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-primary/10 p-3 text-primary w-fit mb-6">
                  <FileCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">State Machine Safety</h3>
                <p className="text-muted-foreground text-sm">
                  Lease lifecycles are controlled by rigorous smart contract transitions, protecting user deposits from double claims.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Timeline */}
      <section id="how-it-works" className="bg-card/30 border-t border-border/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Follow the life of a lease on RentSure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-[45px] left-[15%] right-[15%] h-0.5 bg-border/40 -z-10" />

            <div className="text-center flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-lg mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Draft Lease</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Landlord creates the agreement specifying property details, tenant wallet, and deposit amount.
              </p>
            </div>

            <div className="text-center flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-lg mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Accept & Deposit</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Tenant accepts terms and deposits Stellar tokens (e.g. USDC) directly into the Escrow Contract.
              </p>
            </div>

            <div className="text-center flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-lg mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Active Lease</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Smart contract confirms the locked deposit and activates the lease status for the specified duration.
              </p>
            </div>

            <div className="text-center flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-lg mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2">Settle Escrow</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                At lease end, proposed splits are approved or disputed, and funds are automatically released.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faq" className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8 border-t border-border/40">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-6">
          {[
            {
              q: "Are the funds safe in the smart contract?",
              a: "Yes. Funds are held in an autonomous, audited Soroban smart contract. Neither RentSure nor the landlord can extract the funds without explicit contract-defined conditions and matching authorizations.",
            },
            {
              q: "What tokens can I use for deposit?",
              a: "RentSure supports any standard Stellar Asset Contract (SAC) token. In our default deployment, you can lock deposits using Stellar USDC, EURC, or Native XLM.",
            },
            {
              q: "How are disputes resolved?",
              a: "If a tenant disputes the landlord's proposed refund split, the lease transitions to 'DisputeRaised'. A neutral platform arbitrator reviews property reports and submits a final resolution split via smart contract call.",
            },
          ].map((faq, index) => (
            <div key={index} className="rounded-xl border border-border p-6 bg-card/20">
              <div className="flex items-start space-x-3">
                <HelpCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold text-base mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-b from-card/30 to-background border-t border-border/40 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Ready to Secure Your Next Lease?</h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Connect your Stellar wallet and create a rental escrow in seconds.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href={siteConfig.routes.dashboard}>
              <Button size="lg" className="flex items-center space-x-2">
                <span>Go to App Portal</span>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
