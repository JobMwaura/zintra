'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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
} from 'lucide-react';

const supabase = createClient();

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
      { name: 'Verification Requests', icon: ShieldCheck, href: '/admin/dashboard/verification' },
      { name: 'Subscription Plans', icon: ClipboardList, href: '/admin/dashboard/subscriptions' },
    ],
  },
  {
    title: 'RFQ MANAGEMENT',
    items: [
      { name: 'RFQs', icon: ClipboardList, href: '/admin/dashboard/rfqs' },
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
      { name: 'Messages', icon: MessageSquare, href: '/admin/dashboard/messages' },
    ],
  },
  {
    title: 'USER MANAGEMENT',
    items: [
      { name: 'Users', icon: Users, href: '/admin/users' },
      { name: 'Admin Management', icon: ShieldCheck, href: '/admin/dashboard/admins' },
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

export default function AdminDashboardShell({ children, userEmail = '' }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadUnreadMessageCount = async () => {
      try {
        const { data: unreadMessages, error } = await supabase
          .from('messages')
          .select('id')
          .eq('is_read', false)
          .eq('message_type', 'vendor_to_admin');

        if (!error && unreadMessages && isMounted) {
          setUnreadMessageCount(unreadMessages.length);
        }
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };

    loadUnreadMessageCount();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/admin/login');
      }
    });

    const messageSubscription = supabase
      .channel('admin-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadUnreadMessageCount();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      messageSubscription?.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800">
      <aside
        className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
      >
        <div className="p-6 flex items-center space-x-3 border-b">
          <img src="https://zintra-images-prod.s3.us-east-1.amazonaws.com/logos/logo.png" alt="Zintra Logo" className="w-10 h-10 object-contain" />
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
                  const isMessagesLink = href === '/admin/dashboard/messages';

                  return (
                    <Link
                      key={name}
                      href={href}
                      title={!sidebarOpen ? name : ''}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-orange-500'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="w-5 h-5 mr-3" />
                        {sidebarOpen && name}
                      </div>
                      {isMessagesLink && unreadMessageCount > 0 && (
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            active ? 'bg-white text-orange-500' : 'bg-red-500 text-white'
                          }`}
                        >
                          {unreadMessageCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

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

      <main className="flex-1 flex flex-col">
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