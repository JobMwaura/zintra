/**
 * TrustStrip Component - Trust-Focused
 * Prominent trust indicators + safety guarantees
 */

export default function TrustStrip({ items }) {
  return (
    <section className="w-full bg-gradient-to-r from-green-50 to-blue-50 py-10 sm:py-14 border-b border-green-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-6 text-center">
          Why 2,400+ workers trust Zintra
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col items-center text-center">
              <div className="text-4xl mb-3">{item.icon}</div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {item.title}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Safety Guarantee Banner */}
        <div className="mt-8 pt-8 border-t border-green-200">
          <div className="bg-white rounded-lg border-2 border-green-400 p-4 text-center">
            <p className="text-sm text-gray-700">
              <strong className="text-green-700">✓ No pay-to-get-hired guarantee:</strong> We never ask for upfront fees. Payments only after work is confirmed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
