'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Mail, FileText, Settings, LogOut, Home, CreditCard, BarChart3, User, Save, AlertCircle, Check, Send, Search, Plus, Calendar, Zap, Eye } from 'lucide-react';
import ProfilePreviewTab from '@/components/dashboard/ProfilePreviewTab';
import RFQsTab from '@/components/dashboard/RFQsTab';

export default function VendorDashboard() {
  // Main state
  const [activeMenu, setActiveMenu] = useState('home');
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Messages state
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  // Subscription state
  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(null);

  // Form state for profile
  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    phone: '',
    location: '',
    county: '',
    description: '',
    website: '',
    whatsapp: '',
    price_range: '',
    category: 'General',
    certifications: '',
  });

  // Initial data load
  useEffect(() => {
    fetchVendorData();
    fetchConversations();
    fetchSubscription();
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      console.log('Fetching vendor data...');

      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        console.error('User error:', userError);
        setMessage('Error: Please log in again');
        setLoading(false);
        return;
      }

      console.log('Current user:', currentUser.id);
      setUser(currentUser);

      const { data: vendorData, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching vendor:', error);
        setMessage(`Error loading profile: ${error.message}`);
        setLoading(false);
        return;
      }

      if (vendorData) {
        console.log('Vendor found:', vendorData);
        setVendor(vendorData);
        
        setFormData({
          company_name: vendorData.company_name || '',
          email: vendorData.email || currentUser.email || '',
          phone: vendorData.phone || '',
          location: vendorData.location || '',
          county: vendorData.county || '',
          description: vendorData.description || '',
          website: vendorData.website || '',
          whatsapp: vendorData.whatsapp || '',
          price_range: vendorData.price_range || '',
          category: vendorData.category || 'General',
          certifications: Array.isArray(vendorData.certifications) 
            ? vendorData.certifications.join(', ')
            : vendorData.certifications || '',
        });
      } else {
        console.log('No vendor profile found - creating new one');
        setVendor(null);
        setFormData({
          company_name: '',
          email: currentUser.email || '',
          phone: '',
          location: '',
          county: '',
          description: '',
          website: '',
          whatsapp: '',
          price_range: '',
          category: 'General',
          certifications: '',
        });
      }

      setLoading(false);
    } catch (err) {
      console.error('Error in fetchVendorData:', err);
      setMessage(`Unexpected error: ${err.message}`);
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      setMessagesLoading(true);

      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        console.error('User error:', userError);
        setMessagesLoading(false);
        return;
      }

      const { data: allMessages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        setMessage(`Error loading messages: ${error.message}`);
        setMessagesLoading(false);
        return;
      }

      if (allMessages && allMessages.length > 0) {
        const convMap = {};

        allMessages.forEach(msg => {
          const otherUserId = msg.sender_id === currentUser.id ? msg.recipient_id : msg.sender_id;
          
          if (!convMap[otherUserId]) {
            convMap[otherUserId] = {
              otherUserId: otherUserId,
              messages: [],
              lastMessageTime: msg.created_at,
              unreadCount: 0
            };
          }
          
          convMap[otherUserId].messages.push(msg);
          
          if (msg.is_read === false && msg.recipient_id === currentUser.id) {
            convMap[otherUserId].unreadCount++;
          }
          
          if (new Date(msg.created_at) > new Date(convMap[otherUserId].lastMessageTime)) {
            convMap[otherUserId].lastMessageTime = msg.created_at;
          }
        });

        const conversationsArray = await Promise.all(
          Object.values(convMap).map(async (conv) => {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('vendors')
                .select('email, company_name')
                .eq('user_id', conv.otherUserId)
                .maybeSingle();

              if (profileError) {
                console.warn('Could not fetch profile:', profileError);
              }

              return {
                ...conv,
                id: conv.otherUserId,
                otherEmail: profileData?.email || profileData?.company_name || 'Unknown User',
                lastMessage: conv.messages[conv.messages.length - 1]?.body || 'No messages',
              };
            } catch (e) {
              console.error('Error in conversation mapping:', e);
              return {
                ...conv,
                id: conv.otherUserId,
                otherEmail: 'Unknown User',
                lastMessage: conv.messages[conv.messages.length - 1]?.body || 'No messages',
              };
            }
          })
        );

        const sortedConversations = conversationsArray.sort((a, b) => 
          new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        );

        setConversations(sortedConversations);
      } else {
        setConversations([]);
      }

      setMessagesLoading(false);
    } catch (err) {
      console.error('Error in fetchConversations:', err);
      setMessage(`Error loading conversations: ${err.message}`);
      setMessagesLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      setSubscriptionLoading(true);

      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        setSubscriptionLoading(false);
        return;
      }

      const { data: activeSub, error: subError } = await supabase
        .from('vendor_subscriptions')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subError);
        setSubscriptionLoading(false);
        return;
      }

      if (activeSub) {
        setSubscription(activeSub);

        const { data: planData, error: planError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', activeSub.plan_id)
          .single();

        if (planError) {
          console.error('Error fetching plan:', planError);
        } else {
          setPlan(planData);
        }

        const endDate = new Date(activeSub.end_date);
        const today = new Date();
        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        setDaysRemaining(Math.max(0, daysLeft));
      }

      setSubscriptionLoading(false);
    } catch (err) {
      console.error('Error in fetchSubscription:', err);
      setSubscriptionLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setMessage('');

      if (!user) {
        setMessage('❌ Error: Not authenticated');
        setSaving(false);
        return;
      }

      if (!formData.company_name.trim()) {
        setMessage('❌ Company name is required');
        setSaving(false);
        return;
      }

      const certifications = formData.certifications
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      const updateData = {
        company_name: formData.company_name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        county: formData.county,
        description: formData.description,
        website: formData.website,
        whatsapp: formData.whatsapp,
        price_range: formData.price_range,
        category: formData.category,
        certifications: certifications,
        updated_at: new Date().toISOString(),
      };

      if (vendor?.id) {
        const { error } = await supabase
          .from('vendors')
          .update(updateData)
          .eq('id', vendor.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Update error:', error);
          setMessage(`❌ Error saving profile: ${error.message}`);
          setSaving(false);
          return;
        }

        setMessage('✅ Profile saved successfully!');
        setTimeout(() => {
          setMessage('');
          fetchVendorData();
        }, 2000);
      } else {
        const { error } = await supabase
          .from('vendors')
          .insert([{
            ...updateData,
            user_id: user.id,
          }]);

        if (error) {
          console.error('Insert error:', error);
          setMessage(`❌ Error creating profile: ${error.message}`);
          setSaving(false);
          return;
        }

        setMessage('✅ Profile created successfully!');
        setTimeout(() => {
          setMessage('');
          fetchVendorData();
        }, 2000);
      }

      setSaving(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      setMessage(`❌ Error: ${err.message}`);
      setSaving(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setConversationMessages(conversation.messages || []);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);

      if (!user) {
        setMessage('❌ Error: Not authenticated');
        return;
      }

      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          recipient_id: selectedConversation.otherUserId,
          body: messageText,
          created_at: new Date().toISOString(),
          is_read: false,
        }]);

      if (error) {
        console.error('Error sending message:', error);
        setMessage(`❌ Error sending message: ${error.message}`);
        setSendingMessage(false);
        return;
      }

      setMessageText('');
      await fetchConversations();
      setSendingMessage(false);
    } catch (err) {
      console.error('Error in handleSendMessage:', err);
      setMessage(`❌ Error: ${err.message}`);
      setSendingMessage(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      setMessage(`❌ Error logging out: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
        </div>
      </header>

      {/* Main container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.includes('✅') ? (
              <Check className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <aside className="md:col-span-1">
            <nav className="bg-white rounded-lg shadow p-4 sticky top-24">
              <ul className="space-y-2">
                {[
                  { id: 'home', label: 'Home', icon: Home },
                  { id: 'messages', label: 'Messages', icon: Mail },
                  { id: 'profile-preview', label: 'Profile Preview', icon: Eye },
                  { id: 'profile', label: 'My Profile', icon: User },
                  { id: 'rfqs', label: 'RFQs', icon: FileText },
                  { id: 'subscription', label: 'Subscription', icon: CreditCard },
                  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map(item => {
                  const IconComponent = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveMenu(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                          activeMenu === item.id
                            ? 'bg-orange-100 text-orange-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-3">
            {/* HOME TAB */}
            {activeMenu === 'home' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome, {vendor?.company_name || 'Vendor'}!</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Status</h3>
                    <p className="text-gray-700 mb-4">
                      {vendor ? '✅ Your profile is active' : '⚠️ Complete your profile to get started'}
                    </p>
                    <button
                      onClick={() => setActiveMenu('profile')}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Manage Profile
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscription</h3>
                    <p className="text-gray-700 mb-4">
                      {subscription ? `${daysRemaining} days remaining` : 'Free tier'}
                    </p>
                    <button
                      onClick={() => setActiveMenu('subscription')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View Plans
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MESSAGES TAB */}
            {activeMenu === 'messages' && (
              <div className="bg-white rounded-lg shadow h-96 flex overflow-hidden">
                {/* Conversations list */}
                <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                  <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      />
                    </div>
                  </div>

                  {messagesLoading ? (
                    <div className="p-4 text-center text-gray-500">Loading...</div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No conversations yet</div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {conversations.map(conv => (
                        <li
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv)}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                            selectedConversation?.id === conv.id ? 'bg-orange-50' : ''
                          }`}
                        >
                          <p className="font-medium text-sm text-gray-900">{conv.otherEmail}</p>
                          <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                          {conv.unreadCount > 0 && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold text-white bg-orange-600 rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Messages display */}
                <div className="w-2/3 flex flex-col">
                  {selectedConversation ? (
                    <>
                      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                        <div className="space-y-4">
                          {conversationMessages.map((msg, idx) => (
                            <div
                              key={idx}
                              className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs px-4 py-2 rounded-lg ${
                                  msg.sender_id === user?.id
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-gray-300 text-gray-900'
                                }`}
                              >
                                <p className="text-sm">{msg.body}</p>
                                <p className="text-xs mt-1 opacity-70">
                                  {new Date(msg.created_at).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </div>

                      {/* Message input */}
                      <div className="border-t border-gray-200 p-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={sendingMessage || !messageText.trim()}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition flex items-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Send
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                      <p>Select a conversation to view messages</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PROFILE PREVIEW TAB */}
            {activeMenu === 'profile-preview' && (
              <ProfilePreviewTab />
            )}

            {/* RFQs TAB */}
            {activeMenu === 'rfqs' && (
              <RFQsTab />
            )}

            {/* PROFILE TAB */}
            {activeMenu === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Company Information */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        placeholder="Your company name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="General">General</option>
                        <option value="Construction Materials">Construction Materials</option>
                        <option value="Hardware & Tools">Hardware & Tools</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Paint & Coatings">Paint & Coatings</option>
                        <option value="Services">Services</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Tell customers about your business..."
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City/Town</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g., Nairobi"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
                      <input
                        type="text"
                        name="county"
                        value={formData.county}
                        onChange={handleInputChange}
                        placeholder="e.g., Nairobi County"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+254701234567"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website (Optional)</label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://www.example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp (Optional)</label>
                      <input
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                        placeholder="+254701234567"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                      <input
                        type="text"
                        name="price_range"
                        value={formData.price_range}
                        onChange={handleInputChange}
                        placeholder="e.g., KSh 50,000 - KSh 500,000"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                      <textarea
                        name="certifications"
                        value={formData.certifications}
                        onChange={handleInputChange}
                        placeholder="e.g., ISO 9001, KNBS certified"
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            )}

            {/* SUBSCRIPTION TAB */}
            {activeMenu === 'subscription' && (
              <div className="bg-white rounded-lg shadow p-6">
                {subscriptionLoading ? (
                  <p className="text-gray-600">Loading subscription...</p>
                ) : subscription && plan ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Your Subscription</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Plan</p>
                        <p className="text-2xl font-bold text-gray-900">{plan.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="text-2xl font-bold text-gray-900">KSh {plan.price.toLocaleString()}/mo</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Days Remaining</p>
                        <p className={`text-2xl font-bold ${daysRemaining > 7 ? 'text-green-600' : 'text-orange-600'}`}>
                          {daysRemaining}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Auto-Renew</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {subscription.auto_renew ? '✅ Enabled' : '❌ Disabled'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={() => window.location.href = '/subscription-plans'}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Upgrade Plan
                      </button>
                      <button
                        onClick={() => setMessage('Manage subscription feature coming soon')}
                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium mb-4">No Active Subscription</p>
                    <button
                      onClick={() => window.location.href = '/subscription-plans'}
                      className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Choose a Plan
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeMenu === 'analytics' && (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600">📊 Analytics dashboard coming soon...</p>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeMenu === 'settings' && (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600">⚙️ Settings page coming soon...</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}