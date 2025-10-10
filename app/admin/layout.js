'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  Store,
  ShieldCheck,
  CreditCard,
  FolderKanban,
  Box,
  Quote,
  ClipboardList,
  FileText,
  MessageSquare,
  Users,
  KeyRound,
  Settings,
  BarChart2,
  Lock,
} from 'lucide-react';

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Sidebar */}
      <aside className="w-72 glass-panel flex flex-col p-6">
        {/* Logo */}
        <div className="flex items-center mb-8 space-x-3">
          <img
            src="/zintra-svg-logo.svg"
            alt="Zintra Logo"
            className="h-10 w-auto drop-shadow-sm"
          />
          <div>
            <h2 className="text-xl font-extrabold text-[var(--zintra-dark)] tracking-tight">
              ZINTRA
            </h2>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 space-y-6 overflow-y-auto">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
              Main
            </h3>
            <NavLink href="/admin/dashboard" icon={<LayoutDashboard />}>
              Dashboard
            </NavLink>
          </div>

          <Section title="Vendor Management">
            <NavLink href="/admin/vendors" icon={<Store />}>
              Vendors
            </NavLink>
            <NavLink href="/admin/verifications" icon={<ShieldCheck />}>
              Verification Requests
            </NavLink>
            <NavLink href="/admin/subscriptions" icon={<CreditCard />}>
              Subscription Plans
            </NavLink>
          </Section>

          <Section title="Content Management">
            <NavLink href="/admin/categories" icon={<FolderKanban />}>
              Categories
            </NavLink>
            <NavLink href="/admin/products" icon={<Box />}>
              Products & Services
            </NavLink>
            <NavLink href="/admin/testimonials" icon={<Quote />}>
              Testimonials
            </NavLink>
          </Section>

          <Section title="Project Management">
            <NavLink href="/admin/projects" icon={<ClipboardList />}>
              Projects
            </NavLink>
            <NavLink href="/admin/rfqs" icon={<FileText />}>
              RFQs
            </NavLink>
            <NavLink href="/admin/messages" icon={<MessageSquare />}>
              Messages
            </NavLink>
          </Section>

          <Section title="User Management">
            <NavLink href="/admin/users" icon={<Users />}>
              Users
            </NavLink>
            <NavLink href="/admin/roles" icon={<KeyRound />}>
              Roles & Permissions
            </NavLink>
          </Section>

          <Section title="Settings">
            <NavLink href="/admin/settings" icon={<Settings />}>
              General Settings
            </NavLink>
            <NavLink href="/admin/reports" icon={<BarChart2 />}>
              Reports
            </NavLink>
            <NavLink href="/admin/security" icon={<Lock />}>
              Security
            </NavLink>
          </Section>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top Header Bar */}
        <div className="glass-panel flex justify-between items-center px-6 py-4 mb-8">
          <input
            type="text"
            placeholder="Search..."
            className="w-1/3 px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--zintra-orange)]"
          />
          <div className="flex items-center space-x-4">
            <button className="bg-[var(--zintra-orange)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
              + Add New
            </button>
          </div>
        </div>

        {/* Actual page content */}
        {children}
      </main>
    </div>
  );
}

/* Helper Components */
function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function NavLink({ href, icon, children }) {
  return (
    <Link
      href={href}
      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-[var(--zintra-orange)]/10 hover:text-[var(--zintra-orange)] rounded-lg transition-colors"
    >
      <span className="w-5 h-5 mr-3 opacity-80">{icon}</span>
      {children}
    </Link>
  );
}
