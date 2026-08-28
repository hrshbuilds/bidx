'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ShieldCheck, FileSpreadsheet, Network, History, Sparkles, Building2 } from 'lucide-react';

export function Header() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/judge-demo',
      label: '🎯 Judge Demo Mode',
      icon: <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />,
    },
    {
      href: '/',
      label: 'Evaluation Sheet',
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
    {
      href: '/collusion-graph',
      label: 'Tender Integrity Graph',
      icon: <Network className="w-4 h-4" />,
    },
    {
      href: '/audit-trail',
      label: 'Audit Trail & Hash-Chain',
      icon: <History className="w-4 h-4" />,
    },
    {
      href: '/tender-wizard',
      label: 'Live Tender Creator',
      icon: <Sparkles className="w-4 h-4 text-blue-500" />,
    },
    {
      href: '/seller-portal',
      label: 'Seller Consent Portal',
      icon: <Building2 className="w-4 h-4" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Indian Tricolor Top Bar */}
      <div className="gov-tricolor-bar" />

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gem-blue flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-slate-900">
                  BidFlo <span className="text-gem-blue font-bold text-xs uppercase px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded">GeM Microservice</span>
                </span>
                <span className="hidden md:inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                  Live Agentic Pipeline
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                AI-Powered Integrated Bid Compliance & Collusion Verification Platform
              </p>
            </div>
          </div>

          {/* User Role Indicator */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800">Govt. Procurement Officer</span>
              <span className="text-[10px] text-slate-500">NIC / GeM Trust Boundary</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-xs font-bold text-gem-blue">
              PO
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <nav className="flex items-center gap-1 border-t border-slate-100 py-1 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-gem-blue text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
