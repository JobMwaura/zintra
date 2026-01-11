'use client';

import { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import StatusUpdateCard from './StatusUpdateCard';

export default function StatusUpdateFeed({ vendorId, isVendor = false, onUpdateCreated }) {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch updates
  const fetchUpdates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/status-updates?vendorId=${vendorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch updates');
      }

      const { updates: fetchedUpdates } = await response.json();
      setUpdates(fetchedUpdates || []);
    } catch (err) {
      console.error('Error fetching updates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (vendorId) {
      fetchUpdates();
    }
  }, [vendorId]);

  // Handle new update created
  const handleUpdateCreated = (newUpdate) => {
    setUpdates([newUpdate, ...updates]);
    if (onUpdateCreated) {
      onUpdateCreated(newUpdate);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        <strong>Error loading updates:</strong> {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {updates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm">No updates yet. Be the first to share!</p>
        </div>
      ) : (
        updates.map((update) => (
          <StatusUpdateCard
            key={update.id}
            update={update}
            vendorId={vendorId}
            isVendor={isVendor}
            onLike={(liked) => {
              // Update the like count in state
              setUpdates(
                updates.map((u) =>
                  u.id === update.id ? { ...u, liked, likes_count: u.likes_count + (liked ? 1 : -1) } : u
                )
              );
            }}
          />
        ))
      )}
    </div>
  );
}
