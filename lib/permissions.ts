"use client";

import { useState, useEffect } from "react";

export type PermissionLevel = "none" | "view" | "edit";

export interface MenuItemDefinition {
  key: string;
  label: string;
  href: string;
  category?: string;
}

export const SYSTEM_MENU_ITEMS: MenuItemDefinition[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", category: "Core" },
  { key: "leads", label: "Leads", href: "/leads", category: "CRM" },
  { key: "quotations", label: "Quotations", href: "/quotations", category: "Sales" },
  { key: "customers", label: "Customers", href: "/customers", category: "CRM" },
  { key: "invoices", label: "Invoices", href: "/invoices", category: "Finance" },
  { key: "staff", label: "Staff Management", href: "/staff", category: "Administration" },
  { key: "integrations", label: "Integrations", href: "/integrations", category: "Settings" },
  { key: "custom_objects", label: "Custom Objects", href: "/custom-objects", category: "Data" },
  { key: "settings", label: "Settings", href: "/settings", category: "Settings" },
];

export interface StaffPermissionsState {
  isStaff: boolean;
  staffId: string | null;
  staffName: string | null;
  permissions: Record<string, PermissionLevel>;
  canView: boolean;
  canEdit: boolean;
  loading: boolean;
}

/**
 * Hook to retrieve staff role and check granular permissions for a page
 * @param pageKey The identifier of the page/menu (e.g., "leads", "quotations", "staff")
 */
export function usePermissions(pageKey: string): StaffPermissionsState {
  const [state, setState] = useState<StaffPermissionsState>({
    isStaff: false,
    staffId: null,
    staffName: null,
    permissions: {},
    canView: true,
    canEdit: true,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;

    async function checkPerms() {
      try {
        const savedEmail =
          typeof window !== "undefined"
            ? localStorage.getItem("grownext_user_email")
            : null;
        const queryParam = savedEmail
          ? `?email=${encodeURIComponent(savedEmail)}`
          : "";

        const res = await fetch(`/api/auth/session${queryParam}`);
        const data = await res.json();

        if (!isMounted) return;

        if (data.authenticated && data.isStaff) {
          const perms: Record<string, PermissionLevel> = data.permissions || {};
          const pagePerm = perms[pageKey] || "none";

          setState({
            isStaff: true,
            staffId: data.staffId || null,
            staffName: data.staffName || null,
            permissions: perms,
            canView: pagePerm === "view" || pagePerm === "edit",
            canEdit: pagePerm === "edit",
            loading: false,
          });
        } else {
          // Administrator has full view and edit privileges
          setState({
            isStaff: false,
            staffId: null,
            staffName: null,
            permissions: {},
            canView: true,
            canEdit: true,
            loading: false,
          });
        }
      } catch {
        if (isMounted) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    checkPerms();

    return () => {
      isMounted = false;
    };
  }, [pageKey]);

  return state;
}
