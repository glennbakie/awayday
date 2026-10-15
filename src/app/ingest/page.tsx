'use client';

import { useState } from 'react';
import { parseAndSaveSchedule } from '@/actions/parse-schedule';

export default function IngestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (text) formData.append('text', text);

    const result = await parseAndSaveSchedule(formData);
    setLoading(false);

    if (result.success) {
      setResultData(result.data);
      setShareSlug(result.shareSlug || null);
    } else {
      setError(result.error || 'Failed to parse schedule.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-4 font-sans text-zinc-900">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">AwayDay Ingest</h1>
          <p className="text-zinc-500">Upload schedule screenshots or paste raw text to generate a trip itinerary.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bento Card: Upload */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 flex flex-col gap-4">
            <h2 className="text-xl font-semibold">1. Drop File</h2>
            <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 flex flex-col items-center justify-center text-zinc-500 hover:bg-zinc-50 transition-colors">
              <input 
                type="file" 
                className="hidden" 
                id="file-upload" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm font-medium">{file ? file.name : "Click or drag to upload"}</span>
              </label>
            </div>
          </div>

          {/* Bento Card: Paste */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 flex flex-col gap-4">
            <h2 className="text-xl font-semibold">2. Or Paste Text</h2>
            <textarea 
              className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              placeholder="Paste raw bracket text, emails, etc..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-zinc-900 text-white px-8 py-3 rounded-full font-medium shadow-md hover:bg-zinc-800 disabled:opacity-50 transition-all"
          >
            {loading ? 'Processing...' : 'Generate Itinerary'}
          </button>
        </div>

        {/* Results Preview */}
        {resultData && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Parsed Preview</h2>
              {shareSlug && (
                <a href={`/t/${shareSlug}`} target="_blank" className="text-sm font-medium text-blue-600 hover:underline bg-blue-50 px-3 py-1 rounded-full">
                  Open Public Link →
                </a>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-zinc-500">Tournament:</span> <span className="font-medium">{resultData.tournament_name}</span></div>
                <div><span className="text-zinc-500">Team:</span> <span className="font-medium">{resultData.team_name}</span></div>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-zinc-100">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Time</th>
                      <th className="px-4 py-3 font-medium">Opponent</th>
                      <th className="px-4 py-3 font-medium">Venue</th>
                      <th className="px-4 py-3 font-medium">Court</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {resultData.games?.map((g: any, i: number) => (
                      <tr key={i}>
                        <td className="px-4 py-3 tabular-nums">{new Date(g.tipoff_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-4 py-3 font-medium">{g.opponent}</td>
                        <td className="px-4 py-3">{g.venue_name}</td>
                        <td className="px-4 py-3">{g.court_label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
