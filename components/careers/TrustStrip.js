/**
 * TrustStrip Component - Minimalist
 * Compact trust indicators in a single row
 */

export default function TrustStrip({ items }) {
  return (
    <section className="w-full bg-white py-8 sm:py-12 border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col items-start gap-2">
              <div className="text-2xl">{item.icon}</div>
              <h3 className="text-sm font-semibold text-gray-900">
                {item.title}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
