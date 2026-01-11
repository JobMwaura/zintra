'use client';

import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

export default function LinkPreview({ content }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    // Extract first URL from content
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex);

    if (!urls || urls.length === 0) {
      return;
    }

    const url = urls[0].replace(/[.,;:!?]$/, ''); // Remove trailing punctuation

    // Fetch open graph metadata
    const fetchPreview = async () => {
      try {
        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (!response.ok) return;

        const data = await response.json();
        setPreview({
          url,
          title: data.title,
          description: data.description,
          image: data.image,
          domain: new URL(url).hostname,
        });
      } catch (err) {
        console.error('Failed to fetch link preview:', err);
      }
    };

    fetchPreview();
  }, [content]);

  if (!preview) {
    return null;
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition block no-underline"
    >
      <div className="flex gap-3">
        {preview.image && (
          <div className="flex-shrink-0 w-24 h-24 rounded overflow-hidden bg-slate-100">
            <img src={preview.image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 mb-1">{preview.domain}</p>
          <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">{preview.title}</h4>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2">{preview.description}</p>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
      </div>
    </a>
  );
}
