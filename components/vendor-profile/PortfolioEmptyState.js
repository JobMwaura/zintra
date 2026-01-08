'use client';

/**
 * PortfolioEmptyState Component
 * 
 * Shows when vendor has no portfolio projects.
 * Displays motivating copy + 3 example placeholder cards showing what a finished portfolio looks like.
 * 
 * Props:
 * - canEdit: Boolean (true if vendor viewing own profile)
 * - onAddProject: Callback when "+ Add Project" clicked
 */
export default function PortfolioEmptyState({ canEdit = false, onAddProject }) {
  if (!canEdit) {
    // Customer view - just show helpful message
    return (
      <section className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm text-center">
        <p className="text-slate-600 mb-4">This vendor hasn't added any portfolio projects yet.</p>
        <p className="text-sm text-slate-500">Check back soon or contact them directly to discuss your project!</p>
      </section>
    );
  }

  // Vendor view - show motivating message + examples
  return (
    <section className="space-y-8">
      {/* Motivating Header */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Portfolio</h2>
        <p className="text-slate-700 mb-1">Show customers what you've done.</p>
        <p className="text-slate-600 mb-6">They can request: <span className="font-semibold text-amber-700">"Build for me like this"</span></p>
        
        <button
          onClick={onAddProject}
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition shadow-sm"
        >
          + Add Your First Project
        </button>

        <p className="text-xs text-slate-600 mt-6">
          A strong portfolio increases quote requests by up to 300%. Start with your best work!
        </p>
      </div>

      {/* Example Placeholder Cards */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Here's what a finished portfolio looks like:</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Example 1 */}
          <div className="rounded-lg border border-slate-200 overflow-hidden opacity-60">
            <div className="aspect-square bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl">🏠</span>
                <p className="text-xs text-slate-600 mt-2">Bungalow Example</p>
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-slate-900 text-sm mb-2">3-Bedroom Bungalow</h4>
              <div className="inline-flex items-center mb-3 px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                🏢 Building & Masonry
              </div>
              <div className="space-y-1 mb-4 text-xs text-slate-600">
                <div>✓ Completed: Oct 2025</div>
                <div>💰 Budget: 300k–600k KES</div>
                <div>📍 Narok</div>
              </div>
              <div className="flex gap-2 text-xs">
                <button className="flex-1 py-2 text-slate-600 hover:text-amber-700 font-medium">📤 Share</button>
                <button className="flex-1 py-2 bg-amber-50 text-amber-700 rounded">💬 Quote</button>
              </div>
            </div>
          </div>

          {/* Example 2 */}
          <div className="rounded-lg border border-slate-200 overflow-hidden opacity-60">
            <div className="aspect-square bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl">🛠️</span>
                <p className="text-xs text-slate-600 mt-2">Renovation Example</p>
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-slate-900 text-sm mb-2">Kitchen Renovation</h4>
              <div className="inline-flex items-center mb-3 px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                🔧 Carpentry & Finishes
              </div>
              <div className="space-y-1 mb-4 text-xs text-slate-600">
                <div>✓ Completed: Sep 2025</div>
                <div>💰 Budget: 150k–300k KES</div>
                <div>📍 Nairobi</div>
              </div>
              <div className="flex gap-2 text-xs">
                <button className="flex-1 py-2 text-slate-600 hover:text-amber-700 font-medium">📤 Share</button>
                <button className="flex-1 py-2 bg-amber-50 text-amber-700 rounded">💬 Quote</button>
              </div>
            </div>
          </div>

          {/* Example 3 */}
          <div className="rounded-lg border border-slate-200 overflow-hidden opacity-60">
            <div className="aspect-square bg-gradient-to-br from-green-200 to-green-300 flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl">🌳</span>
                <p className="text-xs text-slate-600 mt-2">Landscaping Example</p>
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-slate-900 text-sm mb-2">Garden Landscaping</h4>
              <div className="inline-flex items-center mb-3 px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                🌱 Landscaping & Grounds
              </div>
              <div className="space-y-1 mb-4 text-xs text-slate-600">
                <div>✓ Completed: Aug 2025</div>
                <div>💰 Budget: 100k–250k KES</div>
                <div>📍 Westlands</div>
              </div>
              <div className="flex gap-2 text-xs">
                <button className="flex-1 py-2 text-slate-600 hover:text-amber-700 font-medium">📤 Share</button>
                <button className="flex-1 py-2 bg-amber-50 text-amber-700 rounded">💬 Quote</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-200">
        <p className="text-sm text-slate-700 mb-4">
          Ready to showcase your work? Upload your best projects and start getting more quote requests.
        </p>
        <button
          onClick={onAddProject}
          className="inline-flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition"
        >
          + Add Project Now
        </button>
      </div>
    </section>
  );
}
