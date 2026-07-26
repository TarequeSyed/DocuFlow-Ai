import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Database, ShoppingBag, Scale, Stethoscope, FileSpreadsheet, BookOpen, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";

interface DemoSelectorDropdownProps {
  onSelectDomain: (domain: string) => Promise<void>;
  isLoading: boolean;
  align?: "left" | "right";
}

export function DemoSelectorDropdown({
  onSelectDomain,
  isLoading,
  align = "left",
}: DemoSelectorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const domains = [
    {
      id: "customer_a",
      label: "Customer A (Alpha Robotics)",
      icon: <ShoppingBag className="w-4 h-4 text-indigo-600" />,
      desc: "6 files: RFQ ➔ Quote ➔ PO ➔ Delivery ➔ Invoice ➔ Receipt",
    },
    {
      id: "customer_b",
      label: "Customer B (Beta Pharma Solutions)",
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" />,
      desc: "6 files: RFQ ➔ Quote ➔ PO ➔ Delivery ➔ Invoice ➔ Receipt",
    },
    {
      id: "procurement",
      label: "Procurement Lifecycle",
      icon: <ShoppingBag className="w-4 h-4 text-blue-600" />,
      desc: "6 files: Quotation ➔ PO ➔ Delivery ➔ Invoice ➔ Receipt ➔ Warranty",
    },
    {
      id: "legal",
      label: "Legal Case & Contracts",
      icon: <Scale className="w-4 h-4 text-indigo-600" />,
      desc: "4 files: MSA Contract ➔ NDA ➔ Amendment #1 ➔ Compliance Audit",
    },
    {
      id: "medical",
      label: "Medical EHR Records",
      icon: <Stethoscope className="w-4 h-4 text-rose-600" />,
      desc: "4 files: Admission ➔ Lab Test ➔ Clinical Diagnosis ➔ Discharge",
    },
    {
      id: "research",
      label: "Research Literature",
      icon: <BookOpen className="w-4 h-4 text-cyan-600" />,
      desc: "3 files: ArXiv RAG Survey ➔ HNSW Indexing ➔ Matryoshka Embeddings",
    },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (domainId: string) => {
    setIsOpen(false);
    await onSelectDomain(domainId);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-1.5 text-indigo-600 animate-spin" />
        ) : (
          <Database className="w-4 h-4 mr-1.5 text-indigo-600" />
        )}
        <span>{isLoading ? "Seeding Workspace..." : "Load Demo Workspace"}</span>
        <ChevronDown className={`w-3.5 h-3.5 ml-1.5 text-neutral-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {isOpen && (
        <div className={`absolute ${align === "right" ? "right-0" : "left-0"} mt-2 w-80 rounded-xl bg-white border border-neutral-200 shadow-2xl z-50 p-2 divide-y divide-neutral-100 animate-in fade-in slide-in-from-top-2 duration-150`}>
          <div className="px-3 py-2 text-[9px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
            Select Industry Demo Workspace
          </div>
          <div className="space-y-1 pt-1">
            {domains.map((dom) => (
              <button
                key={dom.id}
                onClick={() => handleSelect(dom.id)}
                className="w-full text-left p-2.5 rounded-lg hover:bg-neutral-50 transition-colors flex items-start space-x-3 group cursor-pointer border-none"
              >
                <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-200/60 group-hover:border-neutral-300 shrink-0 mt-0.5">
                  {dom.icon}
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-800 group-hover:text-indigo-600">
                    {dom.label}
                  </div>
                  <div className="text-[10px] text-neutral-500 leading-normal mt-0.5">
                    {dom.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
