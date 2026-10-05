"use client";

import React, { useState, useEffect } from "react";
import SoftwareLayout from "@/components/SoftwareLayout";
import AddCustomerModal from "@/components/AddCustomerModal";
import ResponsiveDataList, { ColumnDef } from "@/components/ResponsiveDataList";
import { subscribeToUserCollection } from "@/lib/dataService";
import {
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Calendar,
  Users,
} from "lucide-react";

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  city: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Subscribe to real-time customer updates for the authenticated user
  useEffect(() => {
    const userEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
    if (!userEmail) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserCollection<Customer>(
      "customers",
      userEmail,
      (items) => {
        setCustomers(items);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;

    setDeletingId(id);
    try {
      const res = await fetch("/api/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to delete customer");
      }
    } catch {
      alert("Failed to delete customer");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered by search query
  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(query) ||
      c.mobile.includes(query) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      c.city.toLowerCase().includes(query)
    );
  });

  // Table Columns Definition for Desktop
  const columns: ColumnDef<Customer>[] = [
    {
      key: "name",
      header: "Customer Name",
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[6px] bg-purple-50 text-[#6024a8] flex items-center justify-center text-[12px] font-medium shrink-0">
            {item.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-slate-800 truncate">{item.name}</span>
        </div>
      ),
    },
    {
      key: "mobile",
      header: "Mobile Number",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-slate-700">
          <Phone size={13} className="text-slate-400 shrink-0" />
          <span>{item.mobile}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email Address",
      render: (item) =>
        item.email ? (
          <div className="flex items-center gap-1.5 text-slate-600 truncate max-w-[200px]">
            <Mail size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">{item.email}</span>
          </div>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      key: "city",
      header: "City",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-slate-700">
          <MapPin size={13} className="text-slate-400 shrink-0" />
          <span>{item.city}</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Registered Date",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-slate-500 text-[11.5px]">
          <Calendar size={12} className="text-slate-400 shrink-0" />
          <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleDelete(item.id)}
            disabled={deletingId === item.id}
            title="Delete Customer"
            className="w-7 h-7 max-h-[34px] rounded-[6px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  // Mobile Card UI Layout
  const renderMobileCard = (item: Customer) => (
    <div className="p-3.5 bg-white rounded-[6px] border border-slate-200/80 shadow-2xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[6px] bg-purple-50 text-[#6024a8] flex items-center justify-center text-[12px] font-medium shrink-0">
            {item.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-slate-800 text-[13px]">{item.name}</span>
        </div>

        <button
          type="button"
          onClick={() => handleDelete(item.id)}
          disabled={deletingId === item.id}
          className="text-slate-400 hover:text-rose-600 p-1"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[11.5px] text-slate-600 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 truncate">
          <Phone size={12} className="text-slate-400 shrink-0" />
          <span className="truncate">{item.mobile}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <MapPin size={12} className="text-slate-400 shrink-0" />
          <span className="truncate">{item.city}</span>
        </div>
      </div>

      {item.email && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5 truncate">
          <Mail size={11} className="text-slate-400 shrink-0" />
          <span className="truncate">{item.email}</span>
        </div>
      )}
    </div>
  );

  return (
    <SoftwareLayout pageTitle="Customers">
      <div className="space-y-4">
        {/* Top Control Bar: Search & Action Button - strictly max-h-[34px], rounded-[6px], font-weight 500 */}
        <div className="bg-white rounded-[6px] border border-slate-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[6px] bg-purple-50 text-[#6024a8] flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
            <div>
              <h2 className="text-[13.5px] font-medium text-slate-800 leading-tight">
                Customer Directory
              </h2>
              <span className="text-[11px] text-slate-400">
                {customers.length} {customers.length === 1 ? "customer" : "customers"} registered
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex items-center flex-1 sm:w-[220px]">
              <Search size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers..."
                className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
              />
            </div>

            {/* Add Customer Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="h-[34px] max-h-[34px] px-3.5 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <UserPlus size={14} />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        {/* Dynamic Responsive List: Desktop Table UI, Mobile Card UI, Limit 24, Pagination */}
        <ResponsiveDataList<Customer>
          items={filteredCustomers}
          columns={columns}
          pageSize={24}
          renderMobileCard={renderMobileCard}
          isLoading={loading}
          emptyTitle="No customers yet"
          emptyDescription="Add your first customer with their name, mobile number, email, and city."
          emptyAction={
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="h-[34px] max-h-[34px] px-3.5 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12.5px] font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <UserPlus size={14} />
              <span>Add First Customer</span>
            </button>
          }
        />

        {/* Add Customer Modal */}
        <AddCustomerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={(newCust) => {
            // Real-time onSnapshot listener automatically updates, but we also ensure local sync
            setCustomers((prev) => [newCust, ...prev.filter((c) => c.id !== newCust.id)]);
          }}
        />
      </div>
    </SoftwareLayout>
  );
}
