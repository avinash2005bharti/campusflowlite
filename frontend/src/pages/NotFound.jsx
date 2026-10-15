import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
          <FileQuestion size={32} />
        </div>

        <span className="inline-block text-xs font-black tracking-widest uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full mb-3 border border-indigo-100">
          Error 404
        </span>

        <h1 className="text-2xl font-black text-slate-900 mb-2">
          Page Not Found
        </h1>

        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          The page or resource you are looking for doesn't exist, has been moved, or you don't have access to it.
        </p>

        <div className="flex gap-2.5 justify-center flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-2 transition"
          >
            <ArrowLeft size={14} />
            <span>Go Back</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2 shadow-sm transition"
          >
            <Home size={14} />
            <span>Go to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
