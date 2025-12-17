// File: app/admin/dashboard/layout.js
// Purpose: Admin layout with sidebar + AUTH PROTECTION

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  ClipboardList,
  FolderOpen,
  Package,
  MessageSquare,
  Users,
  KeyRound,
  Settings,
  FileText,
  Lock,
  LogOut,
  Menu,
  X,
  Loader,
} from 'lucide-react';

const navSections = [
  {
    title: 'MAIN',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    ],
  },
  {
    title: 'VENDOR MANAGEMENT',
    items: [
      { name: 'Vendors', icon: Building2, href: '/admin/dashboard/vendors' },
      { name: 'Verification Requests', icon: ShieldCheck, href: '/admin/verifications' },
      { name: 'Subscription Plans', icon: ClipboardList, href: '/admin/dashboard/subscriptions' },
    ],
  },
  {
    title: 'CONTENT MANAGEMENT',
    items: [
      { name: 'Categories', icon: FolderOpen, href: '/admin/categories' },
      { name: 'Products & Services', icon: Package, href: '/admin/products' },
      { name: 'Testimonials', icon: MessageSquare, href: '/admin/testimonials' },
    ],
  },
  {
    title: 'PROJECT MANAGEMENT',
    items: [
      { name: 'Projects', icon: FileText, href: '/admin/projects' },
      { name: 'Messages', icon: MessageSquare, href: '/admin/messages' },
    ],
  },
  {
    title: 'USER MANAGEMENT',
    items: [
      { name: 'Users', icon: Users, href: '/admin/users' },
      { name: 'Roles & Permissions', icon: KeyRound, href: '/admin/roles' },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { name: 'General Settings', icon: Settings, href: '/admin/settings' },
      { name: 'Reports', icon: FileText, href: '/admin/reports' },
      { name: 'Security', icon: Lock, href: '/admin/security' },
    ],
  },
];

export default function AdminDashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // No session - redirect to login
          router.push('/admin/login');
          return;
        }

        // Session exists - get user details
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push('/admin/login');
      }
    });

    return () => subscription?.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'w-72' : 'w-20'
      } bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        <div className="p-6 flex items-center space-x-3 border-b">
          <img src="/logo.svg" alt="Zintra Logo" className="w-10 h-10 object-contain" />
          {sidebarOpen && (
            <div>
              <h1 className="text-2xl font-bold text-orange-500 tracking-wide">ZINTRA</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              {sidebarOpen && (
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2 tracking-wide">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map(({ name, icon: Icon, href }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={name}
                      href={href}
                      title={!sidebarOpen ? name : ''}
                      className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-orange-500'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {sidebarOpen && name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer - Logout */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all disabled:opacity-50"
            title="Logout"
          >
            <LogOut className="w-5 h-5 mr-3" />
            {sidebarOpen && (loggingOut ? 'Logging out...' : 'Logout')}
          </button>
          
          {sidebarOpen && userEmail && (
            <p className="text-xs text-gray-600 mt-3 px-2 truncate">{userEmail}</p>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{userEmail}</span>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <style jsx global>{`
            ::placeholder {
              color: #6b7280;
              opacity: 1;
            }
            input,
            select,
            textarea {
              color: #1f2937;
            }
          `}</style>
          {children}
        </div>
      </main>
    </div>
  );
}