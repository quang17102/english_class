// components/Navbar.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

const levels = [
  { level: "A1", label: "Elementary" },
  { level: "A2", label: "Pre-intermediate" },
  { level: "B1", label: "Intermediate" },
  { level: "B1+", label: "Upper-intermediate" },
  { level: "B2", label: "Pre-advanced" },
  { level: "C1", label: "Advanced" },
];

const Navbar = () => {
  const [isVocabularyHovered, setIsVocabularyHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVocabularyExpanded, setIsVocabularyExpanded] = useState(false);

  return (
    <header className="bg-white shadow-sm relative z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-blue-600">LinguaVerse</span>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 text-sm font-medium items-center">
          <Link href="#grammar" className="hover:text-blue-600">
            Grammar
          </Link>
          <div
            className="relative"
            onMouseEnter={() => setIsVocabularyHovered(true)}
            onMouseLeave={() => setIsVocabularyHovered(false)}
          >
            <Link href="#vocabulary" className="hover:text-blue-600">
              Vocabulary
            </Link>
            {isVocabularyHovered && (
              <div className="absolute top-full left-0 pt-2 bg-transparent">
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 min-w-[280px] py-2">
                  {levels.map((item) => {
                    const getHref = (level: string) => {
                      const levelMap: { [key: string]: string } = {
                        A1: "/vocabulary/a1",
                        A2: "/vocabulary/a2",
                        B1: "/vocabulary/b1",
                        "B1+": "/vocabulary/b1-plus",
                        B2: "/vocabulary/b2",
                        C1: "/vocabulary/c1",
                      };
                      return levelMap[level] || `#vocabulary-${level.toLowerCase()}`;
                    };
                    return (
                      <Link
                        key={item.level}
                        href={getHref(item.level)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-10 h-10 border-2 border-pink-400 rounded-lg flex-shrink-0">
                          <span className="text-pink-500 font-semibold text-sm">
                            {item.level}
                          </span>
                        </div>
                        <span className="text-gray-600 text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <Link href="#listening" className="hover:text-blue-600">
            Listening
          </Link>
          <Link href="#reading" className="hover:text-blue-600">
            Reading
          </Link>
          <Link href="#exams" className="hover:text-blue-600">
            Exams
          </Link>
          <Link href="#level-test" className="hover:text-blue-600">
            Level Test
          </Link>
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button className="text-sm font-medium hover:text-blue-600">
            Log in
          </button>
          <button className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700">
            Upgrade to Pro
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMobileMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-4 space-y-2">
            <Link
              href="#grammar"
              className="block py-2 text-sm font-medium hover:text-blue-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Grammar
            </Link>
            
            {/* Vocabulary with Dropdown */}
            <div>
              <button
                className="w-full flex items-center justify-between py-2 text-sm font-medium hover:text-blue-600"
                onClick={() => setIsVocabularyExpanded(!isVocabularyExpanded)}
              >
                <span>Vocabulary</span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    isVocabularyExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isVocabularyExpanded && (
                <div className="pl-4 mt-2 space-y-2">
                  {levels.map((item) => {
                    const getHref = (level: string) => {
                      const levelMap: { [key: string]: string } = {
                        A1: "/vocabulary/a1",
                        A2: "/vocabulary/a2",
                        B1: "/vocabulary/b1",
                        "B1+": "/vocabulary/b1-plus",
                        B2: "/vocabulary/b2",
                        C1: "/vocabulary/c1",
                      };
                      return levelMap[level] || `#vocabulary-${level.toLowerCase()}`;
                    };
                    return (
                      <Link
                        key={item.level}
                        href={getHref(item.level)}
                        className="flex items-center gap-3 py-2 text-sm text-gray-600 hover:text-blue-600"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsVocabularyExpanded(false);
                        }}
                      >
                        <div className="flex items-center justify-center w-8 h-8 border-2 border-pink-400 rounded-lg flex-shrink-0">
                          <span className="text-pink-500 font-semibold text-xs">
                            {item.level}
                          </span>
                        </div>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              href="#listening"
              className="block py-2 text-sm font-medium hover:text-blue-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Listening
            </Link>
            <Link
              href="#reading"
              className="block py-2 text-sm font-medium hover:text-blue-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Reading
            </Link>
            <Link
              href="#exams"
              className="block py-2 text-sm font-medium hover:text-blue-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Exams
            </Link>
            <Link
              href="#level-test"
              className="block py-2 text-sm font-medium hover:text-blue-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Level Test
            </Link>
            
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <button className="w-full text-left py-2 text-sm font-medium hover:text-blue-600">
                Log in
              </button>
              <button className="w-full text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700">
                Upgrade to Pro
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
