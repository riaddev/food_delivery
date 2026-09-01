import { useState } from "react";
import {
  Bell, ChevronLeft, ChevronRight, LogOut, Menu, X,
} from "lucide-react";
import Logo from "../Logo";

const SIDEBAR_BG = "#0F1117";
const ORANGE = "#F97316";

const Brand = ({ subtitle, collapsed }) => (
  <div
    className={`flex items-center gap-2.5 border-b border-[#1A1D27] ${collapsed ? "justify-center py-5" : "px-[18px] py-5"}`}
  >
    <Logo size={34} variant="color" iconOnly />
    {!collapsed && (
      <div className="min-w-0">
        <div className="text-white font-bold text-[16px] leading-tight">Swift Bite</div>
        {subtitle && (
          <div className="text-[#4B5563] text-[11px] font-medium uppercase tracking-[0.07em] mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
    )}
  </div>
);

const NavButton = ({ item, active, collapsed, onClick }) => {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`w-full flex items-center rounded-lg border-none cursor-pointer font-outfit text-[14.5px] transition-colors duration-150 ${
        collapsed ? "justify-center px-0 py-2.5" : "justify-start px-[11px] py-2.5"
      } ${active ? "text-white font-semibold" : "text-[#6B7280] font-normal hover:bg-[#1A1D27] hover:text-[#D1D5DB]"}`}
      style={{ background: active ? ORANGE : "transparent" }}
    >
      <span className={`shrink-0 flex ${active ? "opacity-100" : "opacity-75"}`}>
        <Icon size={17} strokeWidth={1.8} />
      </span>
      {!collapsed && <span className="flex-1 text-left ml-2.5">{item.label}</span>}
      {!collapsed && item.badge && (
        <span
          className="text-white text-[11px] font-bold rounded-[10px] px-[7px] leading-[17px]"
          style={{ background: active ? "rgba(255,255,255,0.25)" : ORANGE }}
        >
          {item.badge}
        </span>
      )}
    </button>
  );
};

export default function DashboardLayout({
  brandSubtitle,
  navItems = [],
  active,
  onNavigate,
  title,
  subtitle,
  bellBadge,
  userName,
  userRole,
  userAvatar,
  onLogout,
  profileSection,
  sidebarBottom,
  topbarRight,
  children,
  collapsible = true,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = (userName || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-surface" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-sidebar z-40 flex flex-col sidebar-scrollbar overflow-y-auto overflow-x-hidden transition-all duration-200 w-[228px] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-[60px]" : "lg:w-[228px]"}`}
        style={{ background: SIDEBAR_BG }}
      >
        <div className="relative">
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden absolute top-4 right-3 text-zinc-400 hover:text-white"
          >
            <X size={20} />
          </button>
          <Brand subtitle={brandSubtitle} collapsed={collapsed} />
        </div>

        {typeof profileSection === "function" ? profileSection(collapsed) : profileSection}

        <nav className="flex-1 px-[7px] py-2.5">
          {navItems.map((item) => (
            <div key={item.key} className="mb-0.5">
              <NavButton
                item={item}
                active={active === item.key}
                collapsed={collapsed}
                onClick={() => {
                  onNavigate?.(item.key);
                  setMobileOpen(false);
                }}
              />
            </div>
          ))}
        </nav>

        <div className="px-2 py-2 border-t border-[#1A1D27] space-y-1">
          {typeof sidebarBottom === "function" ? sidebarBottom(collapsed) : sidebarBottom}
          {onLogout && (
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-2.5 rounded-lg border-none cursor-pointer text-[14px] text-[#4B5563] hover:text-[#D1D5DB] transition-colors duration-150 font-outfit ${
                collapsed ? "justify-center px-0 py-2.5" : "px-[11px] py-2.5"
              }`}
            >
              <LogOut size={17} strokeWidth={1.8} />
              {!collapsed && <span>Sign Out</span>}
            </button>
          )}
          {collapsible && (
            <button
              onClick={() => setCollapsed((p) => !p)}
              className={`w-full flex items-center justify-center rounded-lg border border-[#1A1D27] cursor-pointer text-[#4B5563] hover:text-[#D1D5DB] transition-colors duration-150 py-2`}
            >
              {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-8 overflow-auto min-w-0">
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-zinc-700 bg-white w-10 h-10 rounded-[9px] border border-border flex items-center justify-center shrink-0"
            >
              <Menu size={19} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg lg:text-[22px] font-bold text-text-primary m-0 tracking-[-0.4px]">{title}</h1>
              {subtitle && <p className="text-[14px] text-text-muted mt-1 mb-0">{subtitle}</p>}
            </div>
          </div>

          <div className="flex gap-2.5 items-center shrink-0">
            {topbarRight}
            {typeof bellBadge === "number" && bellBadge > 0 && (
              <button className="relative w-[38px] h-[38px] bg-card border border-border rounded-[9px] flex items-center justify-center cursor-pointer text-text-muted hover:text-text-primary transition-colors">
                <Bell size={17} strokeWidth={1.8} />
                <span className="absolute -top-1.5 -right-1.5 bg-orange-primary text-white text-[9px] font-bold rounded-full w-[15px] h-[15px] flex items-center justify-center">
                  {bellBadge}
                </span>
              </button>
            )}
            {userName && (
              <div className="flex items-center gap-2.5 bg-card border border-border rounded-[9px] pl-1.5 py-1.5 pr-3">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[13px] shrink-0"
                    style={{ background: ORANGE }}
                  >
                    {initials}
                  </div>
                )}
                <div className="leading-tight">
                  <div className="text-[13px] font-semibold text-text-primary">{userName}</div>
                  {userRole && <div className="text-[11px] text-text-light">{userRole}</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
