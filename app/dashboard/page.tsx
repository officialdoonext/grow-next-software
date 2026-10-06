"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import SoftwareLayout from "@/components/SoftwareLayout";
import StatCardGrid, { StatCardItem } from "@/components/StatCardGrid";
import { subscribeToUserCollection } from "@/lib/dataService";
import {
  Users2,
  FileSpreadsheet,
  Building2,
  Receipt,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Box,
} from "lucide-react";

export default function DashboardPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userEmail =
      typeof window !== "undefined"
        ? localStorage.getItem("grownext_user_email")
        : null;

    if (!userEmail) {
      setLoading(false);
      return;
    }

    const unsubLeads = subscribeToUserCollection("leads", userEmail, (items) => {
      setLeads(items);
      setLoading(false);
    });

    const unsubQuotes = subscribeToUserCollection("quotations", userEmail, (items) => {
      setQuotations(items);
    });

    const unsubCustomers = subscribeToUserCollection("customers", userEmail, (items) => {
      setCustomers(items);
    });

    const unsubInvoices = subscribeToUserCollection("invoices", userEmail, (items) => {
      setInvoices(items);
    });

    return () => {
      if (unsubLeads) unsubLeads();
      if (unsubQuotes) unsubQuotes();
      if (unsubCustomers) unsubCustomers();
      if (unsubInvoices) unsubInvoices();
    };
  }, []);

  const totalRevenue = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const statCards: StatCardItem[] = [
    {
      title: "Total Leads",
      value: leads.length,
      trendText: "↑ 0%",
      subtext: "from last month",
      colorScheme: "purple",
      icon: <Users2 size={18} />,
    },
    {
      title: "Active Quotations",
      value: quotations.length,
      trendText: `${quotations.length > 0 ? "100%" : "0%"}`,
      subtext: "proposals sent",
      colorScheme: "emerald",
      icon: <FileSpreadsheet size={18} />,
    },
    {
      title: "Registered Clients",
      value: customers.length,
      trendText: `${customers.length}`,
      subtext: "active accounts",
      colorScheme: "orange",
      icon: <Building2 size={18} />,
    },
    {
      title: "Paid Invoices",
      value: invoices.filter((i) => i.status === "Paid").length,
      trendText: `₹${Number(totalRevenue).toLocaleString("en-IN")}`,
      subtext: "collected",
      colorScheme: "blue",
      icon: <Receipt size={18} />,
    },
  ];

  return (
    <SoftwareLayout pageTitle="Dashboard">
      <div className="space-y-5">
        {/* Page Title & Subtitle matching redesign mockup */}
        <div>
          <h1 className="text-[26px] font-medium text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-[12.5px] text-slate-500 font-normal mt-0.5">
            High-level business overview, sales pipeline and performance metrics.
          </p>
        </div>

        {/* 4 Stat Cards matching redesign mockup */}
        <StatCardGrid cards={statCards} />

        {/* Workspace Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Quick Actions Panel */}
          <div className="bg-white rounded-[8px] border border-[#ebe8f4] shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-[#f5edfd] text-[#7c3aed] flex items-center justify-center">
                <Box size={16} />
              </div>
              <div>
                <h3 className="text-[14px] font-medium text-slate-900">
                  Quick Actions
                </h3>
                <p className="text-[11.5px] text-slate-400">
                  Manage core workflows directly
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Link
                href="/leads"
                className="w-full h-[34px] px-3 rounded-[6px] bg-[#fbfafd] hover:bg-[#f5edfd] text-slate-700 hover:text-[#7c3aed] border border-slate-200/80 flex items-center justify-between text-[12px] font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <Users2 size={14} className="text-[#7c3aed]" />
                  <span>Create / View Leads</span>
                </div>
                <ArrowRight size={13} className="text-slate-400" />
              </Link>

              <Link
                href="/quotations"
                className="w-full h-[34px] px-3 rounded-[6px] bg-[#fbfafd] hover:bg-[#f5edfd] text-slate-700 hover:text-[#7c3aed] border border-slate-200/80 flex items-center justify-between text-[12px] font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={14} className="text-[#7c3aed]" />
                  <span>Generate Quotation</span>
                </div>
                <ArrowRight size={13} className="text-slate-400" />
              </Link>

              <Link
                href="/customers"
                className="w-full h-[34px] px-3 rounded-[6px] bg-[#fbfafd] hover:bg-[#f5edfd] text-slate-700 hover:text-[#7c3aed] border border-slate-200/80 flex items-center justify-between text-[12px] font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-[#7c3aed]" />
                  <span>Customer Directory</span>
                </div>
                <ArrowRight size={13} className="text-slate-400" />
              </Link>

              <Link
                href="/invoices"
                className="w-full h-[34px] px-3 rounded-[6px] bg-[#fbfafd] hover:bg-[#f5edfd] text-slate-700 hover:text-[#7c3aed] border border-slate-200/80 flex items-center justify-between text-[12px] font-medium transition-all"
              >
                <div className="flex items-center gap-2">
                  <Receipt size={14} className="text-[#7c3aed]" />
                  <span>Issue Invoice</span>
                </div>
                <ArrowRight size={13} className="text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Recent Leads Pipeline */}
          <div className="lg:col-span-2 bg-white rounded-[8px] border border-[#ebe8f4] shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[6px] bg-[#f5edfd] text-[#7c3aed] flex items-center justify-center">
                  <Users2 size={16} />
                </div>
                <div>
                  <h3 className="text-[14px] font-medium text-slate-900">
                    Recent Leads Pipeline
                  </h3>
                  <p className="text-[11.5px] text-slate-400">
                    Latest registered business leads
                  </p>
                </div>
              </div>
              <Link
                href="/leads"
                className="text-[12px] font-medium text-[#7c3aed] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {leads.length === 0 ? (
              <div className="p-8 text-center bg-[#fafafc] rounded-[6px] border border-slate-100">
                <p className="text-[12.5px] text-slate-400">
                  No leads recorded in the system yet.
                </p>
                <Link
                  href="/leads"
                  className="mt-3 inline-flex items-center gap-1.5 h-[32px] px-3 rounded-[6px] bg-[#7c3aed] text-white text-[12px] font-medium hover:bg-[#6d28d9] transition-all"
                >
                  <Plus size={13} />
                  <span>Add First Lead</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {leads.slice(0, 4).map((lead) => (
                  <div
                    key={lead.id}
                    className="py-2.5 flex items-center justify-between hover:bg-[#faf9fd] px-2 rounded-[4px] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-[6px] bg-[#f5edfd] text-[#7c3aed] flex items-center justify-center text-[12px] font-medium shrink-0">
                        {lead.customerName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-[12.5px] font-medium text-slate-800 block leading-tight">
                          {lead.customerName}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {lead.businessName || lead.mobile}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11.5px] text-slate-400">
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SoftwareLayout>
  );
}
