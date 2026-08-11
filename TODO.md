# Admin Platform Dashboard — Implementation Checklist

## Analysis
- [x] Review existing design language (RestaurantDashboard, OwnerDashboard, AdminDashboard)
- [x] Review apiSlice, AuthContext, routing integration points
- [x] Plan created and approved by user

## Build: frontend/src/pages/AdminDashboard/AdminDashboard.jsx
- [x] Dark `bg-zinc-900` sidebar with brand, profile header, Staff badge
- [x] Nav menu (active = `bg-white/10 text-white`, inactive = `text-zinc-400`)
  - LayoutDashboard (Overview)
  - Store (Restaurant Approvals)
  - Users (User Management)
  - UtensilsCrossed (Categories)
  - ShoppingCart (All Orders)
  - LogOut (Logout)
- [x] Main header: "Platform Overview" + subtitle "Real-time metrics for Swift Bite."
- [x] 4 stat cards (৳1,24,500 / 45 / 8,420 / 3)
- [x] Pending Restaurant Approvals table (3 mock rows, Approve/Reject buttons)
- [x] Recent Platform Activity timeline (green/yellow/red dots)
- [x] Wire Approvals / Users / Orders sections to `adminApi` with mock fallbacks
- [x] Toasts + loading skeletons, no emojis, no bouncy hovers, refined shadows

## Verify
- [x] Run frontend build to confirm compilation (✓ built in 1.24s, zero errors)

