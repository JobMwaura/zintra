'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Edit2, Trash2, Users, DollarSign, TrendingUp, AlertCircle, CheckCircle, X, Eye, ArrowLeft } from 'lucide-react';

export default function SubscriptionsAdmin() {
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({
    totalPlans: 0,
    totalVendorsSubscribed: 0,
    monthlyRecurring: 0,
    activeSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // Plan form states
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '',
    features: [],
  });

  // Vendor subscription details
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planVendors, setPlanVendors] = useState([]);
  const [showVendorList, setShowVendorList] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setMessage('');

      // Fetch plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Fetch subscriptions (without complex joins to avoid ambiguity)
      const { data: subsData, error: subsError } = await supabase
        .from('vendor_subscriptions')
        .select('id, vendor_id, user_id, plan_id, start_date, end_date, status, auto_renew, created_at')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Fetch vendors separately
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('id, company_name, user_id');

      // Enrich subscriptions with plan and vendor info
      const enrichedSubs = (subsData || []).map(sub => {
        const plan = plansData?.find(p => p.id === sub.plan_id);
        const vendor = vendorsData?.find(v => v.id === sub.vendor_id);
        return {
          ...sub,
          subscription_plans: plan,
          vendors: vendor
        };
      });

      setSubscriptions(enrichedSubs);

      // Calculate stats
      const activeCount = (enrichedSubs || []).filter(s => s.status === 'active').length;
      const uniqueVendors = new Set((enrichedSubs || []).map(s => s.vendor_id)).size;
      const totalRevenue = plansData ? plansData.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0) : 0;

      setStats({
        totalPlans: plansData?.length || 0,
        totalVendorsSubscribed: uniqueVendors,
        monthlyRecurring: totalRevenue * activeCount,
        activeSubscriptions: activeCount,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlan = async (e) => {
    e.preventDefault();
    if (!planForm.name || !planForm.price) {
      setMessage('Name and price are required');
      return;
    }

    try {
      const payload = {
        name: planForm.name,
        description: planForm.description,
        price: parseFloat(planForm.price),
        features: planForm.features.filter(f => f.trim()).length > 0 
          ? planForm.features.filter(f => f.trim())
          : [],
      };

      let result;
      if (editingPlan) {
        const { data, error } = await supabase
          .from('subscription_plans')
          .update(payload)
          .eq('id', editingPlan.id)
          .select();
        result = { data, error };
      } else {
        const { data, error } = await supabase
          .from('subscription_plans')
          .insert([payload])
          .select();
        result = { data, error };
      }

      if (result.error) throw result.error;

      setMessage(`✓ Plan ${editingPlan ? 'updated' : 'created'} successfully`);
      setPlanForm({ name: '', description: '', price: '', features: [] });
      setEditingPlan(null);
      setShowPlanForm(false);
      fetchData();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure? This will not affect existing subscriptions.')) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      setMessage('✓ Plan deleted successfully');
      fetchData();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description || '',
      price: plan.price?.toString() || '',
      features: Array.isArray(plan.features) ? plan.features : [],
    });
    setShowPlanForm(true);
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
    setPlanForm({ name: '', description: '', price: '', features: [] });
    setShowPlanForm(false);
  };

  const handleShowVendors = async (plan) => {
    setSelectedPlan(plan);
    const vendorsOnPlan = subscriptions.filter(s => s.plan_id === plan.id && s.status === 'active');
    setPlanVendors(vendorsOnPlan);
    setShowVendorList(true);
  };

  const addFeature = () => {
    setPlanForm(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...planForm.features];
    newFeatures[index] = value;
    setPlanForm(prev => ({
      ...prev,
      features: newFeatures
    }));
  };

  const removeFeature = (index) => {
    setPlanForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href="/admin/dashboard/subscriptions" className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Link href="/admin/dashboard" className="hover:text-gray-900">Admin</Link>
                  <span>/</span>
                  <span className="text-gray-900 font-medium">Subscriptions</span>
                </div>
                <h1 className="text-2xl font-bold" style={{ color: '#535554' }}>Subscription Management</h1>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 border-t border-gray-200">
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-3 font-medium transition ${
                activeTab === 'plans'
                  ? 'text-orange-600 border-b-2 border-orange-600 hover:bg-orange-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Plans
              </div>
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-4 py-3 font-medium transition ${
                activeTab === 'vendors'
                  ? 'text-green-600 border-b-2 border-green-600 hover:bg-green-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Vendors
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-3 font-medium transition ${
                activeTab === 'analytics'
                  ? 'text-blue-600 border-b-2 border-blue-600 hover:bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Analytics
              </div>
            </button>
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

        {/* PLANS TAB */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <p className="text-sm text-gray-600 font-medium">Total Plans</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.totalPlans}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <p className="text-sm text-gray-600 font-medium">Active Subscriptions</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{loading ? '...' : stats.activeSubscriptions}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <p className="text-sm text-gray-600 font-medium">Vendors Subscribed</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{loading ? '...' : stats.totalVendorsSubscribed}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <p className="text-sm text-gray-600 font-medium">Monthly Revenue</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">KES {loading ? '...' : (stats.monthlyRecurring || 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Add Plan Button */}
            {!showPlanForm && (
              <button
                onClick={() => setShowPlanForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition"
              >
                <Plus className="w-5 h-5" />
                Create New Plan
              </button>
            )}

            {/* Plan Form */}
            {showPlanForm && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
                <form onSubmit={handleAddPlan} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Plan Name*</label>
                      <input
                        type="text"
                        placeholder="e.g., Starter, Professional"
                        value={planForm.name}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Monthly Price (KES)*</label>
                      <input
                        type="number"
                        placeholder="e.g., 5000"
                        value={planForm.price}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      placeholder="Describe this plan..."
                      value={planForm.description}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">Features</label>
                      <button
                        type="button"
                        onClick={addFeature}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        + Add Feature
                      </button>
                    </div>
                    <div className="space-y-2">
                      {planForm.features.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g., Unlimited RFQ access"
                            value={feature}
                            onChange={(e) => updateFeature(index, e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition"
                    >
                      {editingPlan ? 'Update Plan' : 'Create Plan'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Plans Grid */}
            {!loading && !showPlanForm && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => {
                  const vendorsOnPlan = subscriptions.filter(s => s.plan_id === plan.id && s.status === 'active').length;
                  return (
                    <div key={plan.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold" style={{ color: '#535554' }}>{plan.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                        </div>
                      </div>

                      <div className="mb-4 py-4 border-y border-gray-200">
                        <p className="text-3xl font-bold text-orange-600">KES {parseFloat(plan.price || 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-600 mt-1">per month</p>
                      </div>

                      <div className="mb-6">
                        {Array.isArray(plan.features) && plan.features.length > 0 ? (
                          <ul className="space-y-2">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">No features listed</p>
                        )}
                      </div>

                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong className="text-gray-900">{vendorsOnPlan}</strong> vendors subscribed
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowVendors(plan)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition"
                        >
                          <Eye className="w-4 h-4" />
                          View Vendors
                        </button>
                        <button
                          onClick={() => handleEditPlan(plan)}
                          className="px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VENDORS TAB */}
        {activeTab === 'vendors' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">End Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Auto-Renew</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {subscriptions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-600">
                          No vendor subscriptions yet
                        </td>
                      </tr>
                    ) : (
                      subscriptions.map(sub => (
                        <tr key={sub.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{sub.vendors?.company_name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{sub.user_id}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-gray-900">{sub.subscription_plans?.name || 'Deleted Plan'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              sub.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(sub.start_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : 'Lifetime'}
                          </td>
                          <td className="px-6 py-4">
                            {sub.auto_renew ? (
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Yes</span>
                            ) : (
                              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">No</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subscription Status Distribution */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-6" style={{ color: '#535554' }}>Subscription Status</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Active', value: subscriptions.filter(s => s.status === 'active').length, color: 'bg-green-100', textColor: 'text-green-800' },
                    { label: 'Inactive', value: subscriptions.filter(s => s.status === 'inactive').length, color: 'bg-red-100', textColor: 'text-red-800' },
                    { label: 'Paused', value: subscriptions.filter(s => s.status === 'paused').length, color: 'bg-yellow-100', textColor: 'text-yellow-800' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-gray-700 font-medium">{item.label}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${item.color} ${item.textColor}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plans Popularity */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-6" style={{ color: '#535554' }}>Plans by Popularity</h3>
                <div className="space-y-4">
                  {plans.map(plan => {
                    const count = subscriptions.filter(s => s.plan_id === plan.id && s.status === 'active').length;
                    const percentage = subscriptions.length > 0 ? (count / subscriptions.filter(s => s.status === 'active').length * 100).toFixed(0) : 0;
                    return (
                      <div key={plan.id}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-700 font-medium">{plan.name}</span>
                          <span className="text-sm text-gray-600">{count} vendors ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Subscriptions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-6" style={{ color: '#535554' }}>Recent Subscriptions</h3>
              <div className="space-y-3">
                {subscriptions.slice(0, 10).map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div>
                      <p className="font-medium text-gray-900">{sub.vendors?.company_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{sub.subscription_plans?.name} Plan</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </p>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Vendor List Modal */}
        {showVendorList && selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold" style={{ color: '#535554' }}>
                    {selectedPlan.name} - Active Vendors ({planVendors.length})
                  </h3>
                  <button
                    onClick={() => setShowVendorList(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {planVendors.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">No vendors on this plan yet</p>
                ) : (
                  <div className="space-y-3">
                    {planVendors.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div>
                          <p className="font-medium text-gray-900">{sub.vendors?.company_name}</p>
                          <p className="text-sm text-gray-600">
                            Active since {new Date(sub.start_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {sub.auto_renew ? 'Auto-renewing' : 'Expires ' + new Date(sub.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
