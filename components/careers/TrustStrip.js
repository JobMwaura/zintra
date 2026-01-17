/**
 * TrustStrip Component - Compact Trust-Focused
 * Compact trust indicators + safety guarantees
 */

export default function TrustStrip({ items }) {
  return (
    <section className="w-full bg-gradient-to-r from-green-50 to-blue-50 py-7 sm:py-9 border-b border-green-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4 text-center">
          Why 2,400+ workers trust Zintra
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col items-center text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <h4 className="text-xs font-semibold text-gray-900 mb-0.5">
                {item.title}
              </h4>
              <p className="text-xs text-gray-600 leading-tight">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Safety Guarantee Banner */}
        <div className="bg-white rounded border-2 border-green-400 p-3 text-center">
          <p className="text-xs text-gray-700">
            <strong className="text-green-700">✓ No pay-to-get-hired:</strong> We never ask for upfront fees. Payments only after work is confirmed.
          </p>
        </div>
      </div>
    </section>
  );
}
