import React, { useState, useEffect } from "react";
import { Cpu, Rocket, Menu, X, Sun } from "lucide-react";
import { Button } from "../ui/Button";
import { DemoSelectorDropdown } from "../workspace/DemoSelectorDropdown";

interface HeaderProps {
  onLaunchWorkspace: () => void;
  onSelectDemoDomain: (domain: string) => Promise<void>;
  isSeedingDemo: boolean;
  onNavigateSection: (sectionId: string) => void;
}

export function Header({
  onLaunchWorkspace,
  onSelectDemoDomain,
  isSeedingDemo,
  onNavigateSection,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Capabilities", id: "features" },
    { label: "AI Pipeline", id: "pipeline" },
    { label: "Use Cases", id: "use-cases" },
    { label: "Architecture", id: "tech-stack" },
    { label: "FAQ", id: "faq" },
  ];

  const handleNavClick = (id: string) => {
    onNavigateSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ease-in-out ${
        scrolled
          ? "top-0 left-0 translate-x-0 w-full max-w-none rounded-none py-3.5 bg-white/90 backdrop-blur-xl border-b border-neutral-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
          : "top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-6xl rounded-full py-2.5 bg-white/70 backdrop-blur-lg border border-neutral-200/40 shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
      }`}
    >
      <div className="max-w-6xl mx-auto w-full px-6 sm:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          className="flex items-center space-x-2.5 cursor-pointer group"
          onClick={() => handleNavClick("hero")}
        >
          <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center shadow-md">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-neutral-900 font-sans">
            DocuFlow
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors duration-200 cursor-pointer focus:outline-none"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center space-x-4">
          <DemoSelectorDropdown
            onSelectDomain={onSelectDemoDomain}
            isLoading={isSeedingDemo}
            align="right"
          />

          <Sun className="w-4 h-4 text-neutral-400 cursor-pointer hover:text-neutral-600 transition-colors" />

          <button
            onClick={onLaunchWorkspace}
            className="bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs py-2 px-4 rounded-full shadow-md transition-all duration-200 cursor-pointer"
          >
            Launch Workspace
          </button>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 mt-3 bg-white border border-neutral-200/60 rounded-3xl p-6 space-y-5 shadow-2xl animate-in slide-in-from-top duration-200">
          <div className="flex flex-col space-y-3.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="text-left text-xs font-bold text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col space-y-3 pt-2 border-t border-neutral-100">
            <DemoSelectorDropdown
              onSelectDomain={async (domain) => {
                await onSelectDemoDomain(domain);
                setMobileMenuOpen(false);
              }}
              isLoading={isSeedingDemo}
            />

            <button
              onClick={() => {
                onLaunchWorkspace();
                setMobileMenuOpen(false);
              }}
              className="w-full justify-center bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs py-2.5 rounded-full shadow-md transition-all text-center"
            >
              Launch Workspace
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
