'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { CountyTownFilter } from '@/components/LocationSelector';
import { KENYA_COUNTIES, KENYA_TOWNS_BY_COUNTY } from '@/lib/kenyaLocations';
import {
  Search, Filter, MapPin, Star, CheckCircle, AlertTriangle, Eye, X, 
  Mail, Shield, User, Download, MessageSquare, ArrowLeft, TrendingUp,
  AlertCircle, Phone, Building2, ArrowUpDown, Trash2, PauseCircle, Image as ImageIcon, Upload, Loader
} from 'lucide-react';

export default function ConsolidatedVendors() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'pending';

  // Shared state
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [vendorReviews, setVendorReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageImages, setMessageImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Bulk selection
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [countyFilter, setCountyFilter] = useState('all');
  const [townFilter, setTownFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Sorting states
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  // Stats
  const [stats, setStats] = useState({
    totalVendors: 0,
    pendingCount: 0,
    activeCount: 0,
    rejectedCount: 0,
    suspendedCount: 0,
    flaggedCount: 0,
    avgRating: 0,
  });

  useEffect(() => {
    fetchAllVendors();
  }, []);

  const fetchAllVendors = async () => {
    try {
      setLoading(true);
      setMessage('');
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVendors(data || []);

      // Calculate stats
      const pending = (data || []).filter(v => v.status === 'pending').length;
      const active = (data || []).filter(v => v.status === 'active').length;
      const rejected = (data || []).filter(v => v.status === 'rejected').length;
      const suspended = (data || []).filter(v => v.status === 'suspended').length;
      const flagged = (data || []).filter(v => v.status === 'flagged').length;
      
      const ratings = (data || []).filter(v => v.rating).map(v => v.rating);
      const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;

      setStats({
        totalVendors: data?.length || 0,
        pendingCount: pending,
        activeCount: active,
        rejectedCount: rejected,
        suspendedCount: suspended,
        flaggedCount: flagged,
        avgRating,
      });
    } catch (error) {
      setMessage(`Error loading vendors: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const updateVendorStatus = async (vendorId, status) => {
    try {
      const payload = { status };
      if (status === 'rejected' && rejectReason.trim()) {
        payload.rejection_reason = rejectReason.trim();
      }
      const { error } = await supabase
        .from('vendors')
        .update(payload)
        .eq('id', vendorId);

      if (error) throw error;

      setMessage(`✓ Vendor status updated to ${status}`);
      setShowDetailModal(false);
      setShowRejectModal(false);
      setRejectReason('');
      fetchAllVendors();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleApprove = async (vendorId) => {
    await updateVendorStatus(vendorId, 'active');
  };

  const handleReject = async (vendorId) => {
    if (!rejectReason.trim()) {
      setMessage('Please provide a rejection reason');
      return;
    }
    await updateVendorStatus(vendorId, 'rejected');
  };

  const handleSuspend = async (vendorId) => {
    if (!confirm('Suspend this vendor? They will not be able to respond to RFQs.')) return;
    await updateVendorStatus(vendorId, 'suspended');
  };

  const handleReactivate = async (vendorId) => {
    if (!confirm('Reactivate this vendor?')) return;
    await updateVendorStatus(vendorId, 'active');
  };

  const handleFlag = async (vendorId) => {
    if (!confirm('Flag this vendor for review?')) return;
    await updateVendorStatus(vendorId, 'flagged');
  };

  const handleDelete = async (vendorId) => {
    if (!confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) return;
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ status: 'deleted' })
        .eq('id', vendorId);

      if (error) throw error;
      setMessage('✓ Vendor deleted successfully');
      setShowDetailModal(false);
      fetchAllVendors();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const fetchVendorReviews = async (vendorId) => {
    try {
      setLoadingReviews(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendorReviews(data || []);
      setShowReviewsModal(true);
    } catch (error) {
      setMessage(`Error loading reviews: ${error.message}`);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Handle image upload for messages
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to 5 images
    if (messageImages.length + files.length > 5) {
      setMessage('Maximum 5 images allowed per message');
      return;
    }

    try {
      setUploadingImage(true);

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setMessage(`${file.name} is not an image file`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setMessage(`${file.name} is too large (max 5MB)`);
          continue;
        }

        // Get presigned URL from API
        const response = await fetch('/api/messages/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { uploadUrl, fileUrl } = await response.json();

        // Upload file directly to S3
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image to S3');
        }

        // Add to message images
        setMessageImages(prev => [
          ...prev,
          {
            type: 'image',
            url: fileUrl,
            name: file.name,
            size: file.size,
            uploaded_at: new Date().toISOString(),
          }
        ]);
      }

      setMessage('✓ Images uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      setMessage(`Error uploading images: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove image from message
  const removeMessageImage = (index) => {
    setMessageImages(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!messageBody.trim()) {
      setMessage('Please enter a message');
      return;
    }

    if (!selectedVendor) {
      setMessage('No vendor selected');
      return;
    }

    try {
      setSendingMessage(true);

      // Get current admin user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Not authenticated');
      }

      const adminId = user.id;
      const vendorUserId = selectedVendor.user_id || selectedVendor.id;
      const vendorId = selectedVendor.id;

      console.log('Sending message:', {
        adminId,
        vendorUserId,
        vendorId,
        vendorName: selectedVendor.company_name
      });

      // Step 1: Find or create conversation
      let conversationId;
      const { data: existingConv, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('participant_1_id', adminId)
        .eq('participant_2_id', vendorUserId)
        .maybeSingle();

      if (convError) {
        console.error('Error checking conversation:', convError);
      }

      if (existingConv) {
        console.log('Found existing conversation:', existingConv.id);
        conversationId = existingConv.id;
      } else {
        console.log('Creating new conversation...');
        const { data: newConv, error: createConvError } = await supabase
          .from('conversations')
          .insert([{
            participant_1_id: adminId,
            participant_2_id: vendorUserId,
            subject: messageSubject || `Message to ${selectedVendor.company_name}`
          }])
          .select('id')
          .single();

        if (createConvError) {
          console.error('Error creating conversation:', createConvError);
          throw createConvError;
        }
        
        console.log('Created new conversation:', newConv.id);
        conversationId = newConv.id;
      }

      // Step 2: Insert into vendor_messages table (the actual inbox table for vendors)
      console.log('Inserting message into vendor_messages for vendor inbox...', {
        vendorId,
        vendorUserId,
        conversationId
      });

      const { data: vendorMessage, error: vendorMessageError } = await supabase
        .from('vendor_messages')
        .insert([{
          vendor_id: vendorId,           // The vendor's UUID (vendors.id)
          user_id: vendorUserId,         // The vendor user's UUID (auth user)
          message_text: messageBody,     // The message content
          sender_type: 'admin',          // Identify as admin message
          is_read: false,                // Mark as unread
          sender_name: 'Admin',          // Display name
        }])
        .select('id')
        .single();

      if (vendorMessageError) {
        console.error('Error inserting into vendor_messages:', vendorMessageError);
        throw vendorMessageError;
      }

      console.log('✅ Message saved to vendor_messages:', vendorMessage.id);

      // Step 3: Also save to messages table for admin view
      console.log('Also saving to messages table for admin view...');
      const { error: messageError } = await supabase
        .from('messages')
        .insert([{
          sender_id: adminId,
          recipient_id: vendorUserId,
          conversation_id: conversationId,
          body: messageBody,
          message_type: 'admin_to_vendor',
          attachments: messageImages.length > 0 ? messageImages : []
        }]);

      if (messageError) {
        console.error('Warning: Could not save to messages table:', messageError);
        // Don't fail - message is already in vendor_messages
      } else {
        console.log('✅ Message also saved to messages table');
      }

      console.log('✅ Message sent successfully to vendor');
      setMessage('✓ Message sent successfully');
      setMessageSubject('');
      setMessageBody('');
      setMessageImages([]);
      setShowMessageModal(false);
    } catch (error) {
      console.error('❌ Send message error:', error);
      setMessage(`Error sending message: ${error.message}`);
    } finally {
      setSendingMessage(false);
    }
  };

  const resetFilters = () => {
    setCategoryFilter('all');
    setCountyFilter('all');
    setTownFilter('all');
    setPlanFilter('all');
    setRatingFilter('all');
    setSearchTerm('');
  };

  const applyFilters = (vendorList) => {
    return vendorList
      .filter(v => !searchTerm || v.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || v.category?.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(v => categoryFilter === 'all' || v.category === categoryFilter)
      .filter(v => countyFilter === 'all' || v.county === countyFilter)
      .filter(v => townFilter === 'all' || v.location === townFilter)
      .filter(v => planFilter === 'all' || (v.subscription_plan || v.plan || 'Free') === planFilter)
      .filter(v => {
        if (ratingFilter === 'all') return true;
        const rating = v.rating || 0;
        switch (ratingFilter) {
          case '4.5+': return rating >= 4.5;
          case '4.0+': return rating >= 4.0;
          case '3.5+': return rating >= 3.5;
          case '3.0+': return rating >= 3.0;
          default: return true;
        }
      });
  };

  const applySorting = (vendorList) => {
    const sorted = [...vendorList];
    sorted.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortKey) {
        case 'company_name':
          aVal = (a.company_name || '').toLowerCase();
          bVal = (b.company_name || '').toLowerCase();
          break;
        case 'rating':
          aVal = a.rating || 0;
          bVal = b.rating || 0;
          break;
        case 'rfqs_completed':
          aVal = a.rfqs_completed || 0;
          bVal = b.rfqs_completed || 0;
          break;
        case 'revenue':
          aVal = a.revenue || 0;
          bVal = b.revenue || 0;
          break;
        case 'created_at':
        default:
          aVal = new Date(a.created_at || 0).getTime();
          bVal = new Date(b.created_at || 0).getTime();
      }
      
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  // Filtered vendors
  const pendingVendors = useMemo(() => {
    const pending = (vendors || []).filter(v => v.status === 'pending');
    return applySorting(applyFilters(pending));
  }, [vendors, searchTerm, categoryFilter, countyFilter, townFilter, planFilter, ratingFilter, sortKey, sortDir]);

  const activeVendors = useMemo(() => {
    const active = (vendors || []).filter(v => v.status === 'active');
    return applySorting(applyFilters(active));
  }, [vendors, searchTerm, categoryFilter, countyFilter, townFilter, planFilter, ratingFilter, sortKey, sortDir]);

  const rejectedVendors = useMemo(() => {
    const rejected = (vendors || []).filter(v => v.status === 'rejected');
    return applySorting(applyFilters(rejected));
  }, [vendors, searchTerm, categoryFilter, countyFilter, townFilter, planFilter, ratingFilter, sortKey, sortDir]);

  // Get unique categories and counties
  const categories = useMemo(() => {
    const cats = new Set((vendors || []).map(v => v.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [vendors]);

  const counties = useMemo(() => {
    const cs = new Set((vendors || []).map(v => v.county).filter(Boolean));
    return Array.from(cs).sort();
  }, [vendors]);

  const planOptions = ['Free', 'Basic', 'Premium', 'Diamond'];
  const ratingOptions = ['all', '4.5+', '4.0+', '3.5+', '3.0+'];

  const activeFiltersCount = [planFilter, ratingFilter, categoryFilter, countyFilter, townFilter, searchTerm].filter(f => f !== 'all' && f !== '').length;

  const exportCSV = () => {
    const dataToExport = activeTab === 'pending' ? pendingVendors : activeTab === 'active' ? activeVendors : rejectedVendors;
    
    const headers = ['Company Name', 'Category', 'County', 'Plan', 'Status', 'Rating', 'RFQs', 'Revenue', 'Joined', 'Email', 'Phone'];
    const rows = dataToExport.map(v => [
      v.company_name || '',
      v.category || '',
      v.county || '',
      v.subscription_plan || v.plan || 'Free',
      v.status || '',
      v.rating || '',
      v.rfqs_completed || 0,
      v.revenue || '',
      v.created_at ? new Date(v.created_at).toLocaleDateString() : '',
      v.contact_email || '',
      v.phone || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vendors-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleVendorSelection = (vendorId) => {
    setSelectedVendorIds(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const selectAllInTab = () => {
    const vendorList = activeTab === 'pending' ? pendingVendors : activeTab === 'active' ? activeVendors : rejectedVendors;
    if (selectedVendorIds.length === vendorList.length) {
      setSelectedVendorIds([]);
    } else {
      setSelectedVendorIds(vendorList.map(v => v.id));
    }
  };

  const verifySelected = async () => {
    if (selectedVendorIds.length === 0) return;
    if (!confirm(`Approve ${selectedVendorIds.length} vendor(s)?`)) return;
    
    try {
      for (const vendorId of selectedVendorIds) {
        await updateVendorStatus(vendorId, 'active');
      }
      setSelectedVendorIds([]);
      setMessage(`✓ ${selectedVendorIds.length} vendor(s) approved`);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const renderVendorCard = (vendor) => (
    <div key={vendor.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-orange-300 transition shadow-sm flex gap-4">
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selectedVendorIds.includes(vendor.id)}
        onChange={() => toggleVendorSelection(vendor.id)}
        className="w-5 h-5 mt-2 cursor-pointer"
      />
      
      <div className="flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{vendor.company_name || 'Unnamed'}</h3>
            <p className="text-sm text-gray-600 mt-1">{vendor.category || 'N/A'}</p>
          </div>
          <div className="flex gap-2">
            {vendor.verified && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Verified
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              vendor.status === 'active' ? 'bg-green-100 text-green-700' :
              vendor.status === 'pending' ? 'bg-orange-100 text-orange-700' :
              vendor.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {vendor.status}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-4 border-y border-gray-200 mb-4">
          <div>
            <p className="text-xs text-gray-500 font-medium">Location</p>
            <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {vendor.county || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Rating</p>
            <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-1">
              {vendor.rating ? (
                <>
                  <Star className="w-3 h-3 text-yellow-500" />
                  {vendor.rating.toFixed(1)}
                </>
              ) : (
                'No rating'
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">RFQs</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{vendor.rfqs_completed || 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Revenue</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {vendor.revenue ? `KSh ${Number(vendor.revenue).toLocaleString()}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Joined</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-600 font-medium mb-2">Contact Information</p>
          <div className="space-y-1 text-sm text-gray-700">
            {vendor.contact_email && (
              <p className="flex items-center gap-2">
                <Mail className="w-3 h-3" />
                {vendor.contact_email}
              </p>
            )}
            {vendor.phone && (
              <p className="flex items-center gap-2">
                <Phone className="w-3 h-3" />
                {vendor.phone}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
        {activeTab === 'pending' && (
          <>
            <button
              onClick={() => handleApprove(vendor.id)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => {
                setSelectedVendor(vendor);
                setShowDetailModal(true);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center gap-2 text-sm"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
            <button
              onClick={() => {
                setSelectedVendor(vendor);
                setShowRejectModal(true);
              }}
              className="px-4 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition text-sm"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleFlag(vendor.id)}
              className="px-4 py-2 border border-orange-300 rounded-lg text-orange-600 hover:bg-orange-50 transition flex items-center gap-2 text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              Flag
            </button>
          </>
        )}

        {activeTab === 'active' && (
          <>
            <button
              onClick={() => {
                setSelectedVendor(vendor);
                setShowDetailModal(true);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center gap-2 text-sm"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
            <button
              onClick={() => fetchVendorReviews(vendor.id)}
              className="px-4 py-2 border border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition flex items-center gap-2 text-sm"
            >
              <Star className="w-4 h-4" />
              Reviews
            </button>
            <button
              onClick={() => handleSuspend(vendor.id)}
              className="px-4 py-2 border border-yellow-300 rounded-lg text-yellow-600 hover:bg-yellow-50 transition flex items-center gap-2 text-sm"
            >
              <PauseCircle className="w-4 h-4" />
              Suspend
            </button>
            <button
              onClick={() => handleFlag(vendor.id)}
              className="px-4 py-2 border border-orange-300 rounded-lg text-orange-600 hover:bg-orange-50 transition flex items-center gap-2 text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              Flag
            </button>
            <button
              onClick={() => {
                setSelectedVendor(vendor);
                setShowMessageModal(true);
              }}
              className="px-4 py-2 border border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 transition flex items-center gap-2 text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Message
            </button>
            <button
              onClick={() => handleDelete(vendor.id)}
              className="px-4 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition flex items-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </>
        )}

        {activeTab === 'rejected' && (
          <>
            <button
              onClick={() => {
                setSelectedVendor(vendor);
                setShowDetailModal(true);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center gap-2 text-sm"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
            <button
              onClick={() => fetchVendorReviews(vendor.id)}
              className="px-4 py-2 border border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition flex items-center gap-2 text-sm"
            >
              <Star className="w-4 h-4" />
              Reviews
            </button>
            <button
              onClick={() => handleReactivate(vendor.id)}
              className="px-4 py-2 border border-green-300 rounded-lg text-green-600 hover:bg-green-50 transition flex items-center gap-2 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Reactivate
            </button>
            <button
              onClick={() => handleDelete(vendor.id)}
              className="px-4 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition flex items-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </>
        )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Link href="/admin/dashboard" className="hover:text-gray-900">Admin</Link>
                  <span>/</span>
                  <span className="text-gray-900 font-medium">Vendor Management</span>
                </div>
                <h1 className="text-2xl font-bold" style={{ color: '#535554' }}>Vendor Management</h1>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 border-t border-gray-200">
              <Link
                href="?tab=pending"
                className={`px-4 py-3 font-medium transition ${
                  activeTab === 'pending'
                    ? 'text-orange-600 border-b-2 border-orange-600 hover:bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Pending ({stats.pendingCount})
                </div>
              </Link>
              <Link
                href="?tab=active"
                className={`px-4 py-3 font-medium transition ${
                  activeTab === 'active'
                    ? 'text-green-600 border-b-2 border-green-600 hover:bg-green-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Active ({stats.activeCount})
                </div>
              </Link>
              <Link
                href="?tab=rejected"
                className={`px-4 py-3 font-medium transition ${
                  activeTab === 'rejected'
                    ? 'text-red-600 border-b-2 border-red-600 hover:bg-red-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Rejected ({stats.rejectedCount})
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.includes('✓')
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-3">
              {message.includes('✓') ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {message}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-600 font-medium">Total Vendors</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.totalVendors}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-600 font-medium">Pending</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{loading ? '...' : stats.pendingCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-600 font-medium">Active</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{loading ? '...' : stats.activeCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-600 font-medium">Average Rating</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2 flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> {loading ? '...' : stats.avgRating}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-600 font-medium">Filters Applied</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{activeFiltersCount}</p>
            {activeFiltersCount > 0 && (
              <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline mt-2">Reset filters</button>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        {(activeTab === 'pending' || selectedVendorIds.length > 0) && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedVendorIds.length > 0 ? `${selectedVendorIds.length} vendor(s) selected` : 'Quick Actions'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedVendorIds.length > 0 && activeTab === 'pending' && (
                  <button
                    onClick={verifySelected}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve {selectedVendorIds.length} Selected
                  </button>
                )}
                {selectedVendorIds.length > 0 && (
                  <button
                    onClick={() => setSelectedVendorIds([])}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition text-sm"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>
            
            {/* Status Summary */}
            {activeTab === 'pending' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 font-medium mb-3">Pending Summary</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Pending</p>
                    <p className="text-lg font-semibold text-orange-600">{stats.pendingCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Shown</p>
                    <p className="text-lg font-semibold text-gray-900">{pendingVendors.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Selected</p>
                    <p className="text-lg font-semibold text-blue-600">{selectedVendorIds.length}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendors by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Active Filter Chips */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100">
                    Search: {searchTerm}
                  </span>
                )}
                {planFilter !== 'all' && (
                  <span className="px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100">
                    Plan: {planFilter}
                  </span>
                )}
                {ratingFilter !== 'all' && (
                  <span className="px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100">
                    Rating: {ratingFilter}
                  </span>
                )}
                {categoryFilter !== 'all' && (
                  <span className="px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100">
                    Category: {categoryFilter}
                  </span>
                )}
                {countyFilter !== 'all' && (
                  <span className="px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100">
                    County: {countyFilter}
                  </span>
                )}
                {townFilter !== 'all' && (
                  <span className="px-3 py-1 rounded-full text-xs bg-purple-50 text-purple-700 border border-purple-100">
                    Location: {townFilter}
                  </span>
                )}
              </div>
            )}

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Plan</label>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Plans</option>
                  {planOptions.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {ratingOptions.map(r => (
                    <option key={r} value={r}>{r === 'all' ? 'All Ratings' : `${r} stars`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">County</label>
                    <select
                      value={countyFilter === 'all' ? '' : countyFilter}
                      onChange={(e) => setCountyFilter(e.target.value || 'all')}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">All Counties</option>
                      {KENYA_COUNTIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                    <select
                      value={townFilter === 'all' ? '' : townFilter}
                      onChange={(e) => setTownFilter(e.target.value || 'all')}
                      disabled={countyFilter === 'all'}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">All Locations</option>
                      {countyFilter !== 'all' && KENYA_TOWNS_BY_COUNTY[countyFilter]?.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={selectAllInTab}
                className="inline-flex items-center gap-2 px-3 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 text-blue-700"
              >
                <input
                  type="checkbox"
                  checked={selectedVendorIds.length > 0 && selectedVendorIds.length === (activeTab === 'pending' ? pendingVendors.length : activeTab === 'active' ? activeVendors.length : rejectedVendors.length)}
                  onChange={selectAllInTab}
                  className="w-4 h-4 cursor-pointer"
                />
                {selectedVendorIds.length === (activeTab === 'pending' ? pendingVendors.length : activeTab === 'active' ? activeVendors.length : rejectedVendors.length) && (activeTab === 'pending' ? pendingVendors.length : activeTab === 'active' ? activeVendors.length : rejectedVendors.length) > 0 ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={resetFilters}
                disabled={activeFiltersCount === 0}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" /> Clear filters
              </button>
              <button
                onClick={exportCSV}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <span className="text-xs text-gray-500 self-center">
                Showing {activeTab === 'pending' ? pendingVendors.length : activeTab === 'active' ? activeVendors.length : rejectedVendors.length} of {vendors.length} vendors
              </span>
            </div>
          </div>
        </div>

        {/* Vendor Cards */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#ea8f1e' }}></div>
            <p className="mt-4 text-gray-600">Loading vendors...</p>
          </div>
        ) : (
          <>
            {activeTab === 'pending' && (
              <div>
                {pendingVendors.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No pending vendors</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingVendors.map(renderVendorCard)}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'active' && (
              <div>
                {activeVendors.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No active vendors</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeVendors.map(renderVendorCard)}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rejected' && (
              <div>
                {rejectedVendors.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <X className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No rejected vendors</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rejectedVendors.map(renderVendorCard)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{selectedVendor.company_name}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-2">Company Description</p>
                <p className="text-gray-900">{selectedVendor.description || 'No description provided'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Category</p>
                  <p className="text-gray-900 mt-1">{selectedVendor.category || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">County</p>
                  <p className="text-gray-900 mt-1">{selectedVendor.county || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Rating</p>
                  <p className="text-gray-900 mt-1">{selectedVendor.rating ? selectedVendor.rating.toFixed(1) : 'No rating'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Plan</p>
                  <p className="text-gray-900 mt-1">{selectedVendor.subscription_plan || selectedVendor.plan || 'Free'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-medium mb-3">Performance Metrics</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">RFQs Received</p>
                    <p className="text-gray-900 font-medium">{selectedVendor.rfqs_received || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">RFQs Completed</p>
                    <p className="text-gray-900 font-medium">{selectedVendor.rfqs_completed || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Avg Response Time</p>
                    <p className="text-gray-900 font-medium">{selectedVendor.response_time || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Quote Acceptance</p>
                    <p className="text-gray-900 font-medium">{selectedVendor.quote_acceptance_rate || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Revenue</p>
                    <p className="text-gray-900 font-medium">{selectedVendor.revenue ? `KSh ${Number(selectedVendor.revenue).toLocaleString()}` : '—'}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-medium mb-3">Compliance</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Flags</p>
                    <p className="text-gray-900 font-medium">{selectedVendor.flags || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Suspensions</p>
                    <p className="text-gray-900 font-medium">{selectedVendor.suspensions || 0}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-medium mb-3">Contact Information</p>
                <div className="space-y-2 text-sm">
                  {selectedVendor.contact_email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {selectedVendor.contact_email}
                    </p>
                  )}
                  {selectedVendor.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {selectedVendor.phone}
                    </p>
                  )}
                </div>
              </div>

              {selectedVendor.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700 font-medium">Rejection Reason</p>
                  <p className="text-red-600 mt-1">{selectedVendor.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900">Reject Vendor</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why you're rejecting this vendor..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedVendor.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Modal */}
      {showReviewsModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Vendor Reviews</h2>
                <p className="text-sm text-gray-600">{selectedVendor.company_name}</p>
              </div>
              <button
                onClick={() => setShowReviewsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {loadingReviews ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#ea8f1e' }}></div>
                  <p className="mt-2 text-gray-600">Loading reviews...</p>
                </div>
              ) : vendorReviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vendorReviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-200 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < (review.rating || 0)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{review.rating}/5</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 font-medium mb-2">{review.author || 'Anonymous'}</p>
                      <p className="text-sm text-gray-700 mb-3">{review.comment}</p>
                      
                      {review.vendor_response && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                          <p className="text-xs font-medium text-blue-900 mb-1">Vendor Response</p>
                          <p className="text-sm text-blue-800">{review.vendor_response}</p>
                          {review.responded_at && (
                            <p className="text-xs text-blue-600 mt-1">
                              {new Date(review.responded_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 p-6 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Send Message</h2>
                <p className="text-sm text-gray-600">{selectedVendor.company_name}</p>
              </div>
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setMessageImages([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject (optional)
                </label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder={`Message to ${selectedVendor.company_name}`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Type your message to the vendor..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={6}
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attach Images (optional)
                </label>
                <div className="space-y-3">
                  {/* Upload Button */}
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImage || messageImages.length >= 5}
                      className="hidden"
                    />
                    {uploadingImage ? (
                      <>
                        <Loader className="w-5 h-5 text-purple-600 animate-spin" />
                        <span className="text-sm text-purple-600">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-600" />
                        <span className="text-sm text-gray-600">
                          {messageImages.length >= 5 
                            ? 'Maximum 5 images reached' 
                            : 'Click to upload images (max 5, 5MB each)'}
                        </span>
                      </>
                    )}
                  </label>

                  {/* Image Previews */}
                  {messageImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {messageImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            onClick={() => removeMessageImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="mt-1 text-xs text-gray-500 truncate">
                            {img.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setMessageImages([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                  disabled={sendingMessage || uploadingImage}
                >
                  Cancel
                </button>
                <button
                  onClick={sendMessage}
                  disabled={sendingMessage || uploadingImage || !messageBody.trim()}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sendingMessage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      Send Message {messageImages.length > 0 && `(${messageImages.length} ${messageImages.length === 1 ? 'image' : 'images'})`}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
