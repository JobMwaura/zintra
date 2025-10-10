'use client';
import { useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Download,
  Plus,
  Filter,
  MoreHorizontal,
  AlertCircle,
  UserPlus,
  CheckCircle,
  FileText,
  TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminRoot() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#ca8637' }}></div>
        <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}