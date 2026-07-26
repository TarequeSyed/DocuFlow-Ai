import React from "react";
import { ArrowRight, Sparkles, Database } from "lucide-react";
import { Button } from "../ui/Button";
import { InteractiveSandbox } from "./InteractiveSandbox";
import BackgroundShaders from "../ui/background-shaders";

interface HeroProps {
  onLaunchWorkspace: () => void;
  onLoadDemo: () => void;
  isSeedingDemo: boolean;
}

export function Hero({ onLaunchWorkspace, onLoadDemo, isSeedingDemo }: HeroProps) {
  return (
    <section id="hero" className="relative z-0 pt-44 pb-28 bg-transparent overflow-hidden">
      {/* Dynamic Animated WebGL Warp Shader Background */}
      <BackgroundShaders />

      {/* Absolute decorative gradient grids */}
      <div className="absolute inset-0 bg-grid-dots pointer-events-none opacity-40" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10 text-center flex flex-col items-center">
        {/* Sparkle micro-badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/60 text-neutral-600 text-xs mb-8 shadow-sm backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span className="font-semibold text-[10px] uppercase tracking-wider text-neutral-800">
            Enterprise Document Intelligence
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-7xl font-bold tracking-tight text-neutral-900 max-w-5xl leading-[1.08] mb-8 font-sans">
          Transform Document Workflows. <br />
          Accelerate Knowledge Insights.
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-neutral-600 max-w-2xl leading-relaxed mb-10">
          Simplify document ingestion and audit transparency. DocuFlow AI automatically builds semantic knowledge graphs, reconstructs chronological transactions, and enforces validated schemas.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
          <button
            onClick={onLaunchWorkspace}
            className="flex items-center justify-center bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs py-3 px-6 rounded-full shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Explore Workspace</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>

          <button
            onClick={onLoadDemo}
            disabled={isSeedingDemo}
            className="flex items-center justify-center bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 font-bold text-xs py-3 px-6 rounded-full shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            <Database className="w-4 h-4 mr-2 text-neutral-400" />
            <span>{isSeedingDemo ? "Seeding Demo Data..." : "Load Demo Dataset"}</span>
          </button>
        </div>

        {/* Key Metrics grid layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-4xl border-t border-neutral-200/60 pt-12 mb-20 text-left">
          <div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 font-sans">
              100%
            </div>
            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-1 font-mono">
              Citation Provenance
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 font-sans">
              384d
            </div>
            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-1 font-mono">
              Vector Embeddings
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 font-sans">
              2-Way
            </div>
            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-1 font-mono">
              Graph & Timeline
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 font-sans">
              JSONB
            </div>
            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-1 font-mono">
              Schema Verified
            </div>
          </div>
        </div>

        {/* Floating Mock Workspace Interactive Preview */}
        <div className="relative w-full max-w-5xl rounded-3xl border border-neutral-200/50 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.06)] p-2 animate-in slide-in-from-bottom duration-700">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-cyan-500/5 rounded-3xl pointer-events-none" />
          <InteractiveSandbox />
        </div>
      </div>
    </section>
  );
}
