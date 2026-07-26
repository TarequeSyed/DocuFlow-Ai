import React from "react";
import { Cpu } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5">
            <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
              <Cpu className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div>
            <span className="font-bold text-slate-200">DocuFlow AI</span>
            <p className="text-xs text-slate-500">
              Enterprise AI Document Intelligence Platform
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-xs text-slate-400">
          <span>PostgreSQL + pgvector</span>
          <span>FastAPI</span>
          <span>Next.js 16</span>
          <span>SentenceTransformers</span>
        </div>

        <div className="text-xs text-slate-500">
          © {new Date().getFullYear()} DocuFlow AI. Open Source Production Release.
        </div>
      </div>
    </footer>
  );
}
