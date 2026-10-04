<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# GrowNext Core Architectural Rules & Standards

These rules are strictly enforced across the entire codebase:

1. **Strictly Dynamic & Non-Static (No Dummy Data)**:
   - Absolutely no hardcoded mock/dummy rows, products, or fake items.
   - When no user data exists in Firestore, render a clean empty state with actionable buttons to create records.

2. **Fetch Limit strictly 24 Items (Recent First)**:
   - Every list/collection query must use `limit(24)` and be ordered by `createdAt` descending (`orderBy("createdAt", "desc")`).

3. **Responsive List Layout (Desktop Table, Mobile Card UI)**:
   - On Desktop (`md:` and above): Render clean, sleek **Table Layout**.
   - On Mobile (`sm:` and below): Render responsive **Card UI Layout**.

4. **Pagination**:
   - Provide pagination (`Previous`, `Page X of Y`, `Next`) with interactive page controls conforming strictly to design constraints.

5. **Real-Time Data Visibility**:
   - Lists and data must update in real-time or immediately refresh upon action so newly added/modified items appear instantly.

6. **STRICT USER-SPECIFIC DATA ISOLATION (Multi-Tenant)**:
   - Every created document (`leads`, `quotations`, `customers`, `invoices`, `custom-objects`, etc.) MUST store `userId` (the authenticated user's normalized email).
   - Every query MUST filter by `where("userId", "==", userEmail)`.
   - User A must NEVER see User B's data under any circumstance.

7. **Design System Constraints**:
   - All interactive elements (buttons, inputs, dropdowns, pagination buttons) MUST have maximum height $\le 34\text{px}$.
   - All border-radii MUST be $\le 6\text{px}$ everywhere.
   - Sora font family only; font-weight $\le 500$ maximum (no 600, 700, or heavy weights).
   - Zero "POS" terminology anywhere.
