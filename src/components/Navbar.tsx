import React from 'react';
import { NavLink } from 'react-router-dom';
import { PlayCircle, BarChart3, History } from 'lucide-react';
import { BackendStatusBadge } from './BackendStatusBadge';

export const Navbar: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
              <span className="text-brand-400 text-lg">E</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight">Evolyn</span>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded tracking-wider uppercase border border-slate-200">
                  Backend Test Client
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-none mt-0.5">
                Brand Governance Platform Test Harness
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <PlayCircle className="w-4 h-4 text-brand-600" />
              <span>Test Workspace</span>
            </NavLink>

            <NavLink
              to="/results"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Analysis Results</span>
            </NavLink>

            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <History className="w-4 h-4 text-slate-600" />
              <span>Execution History</span>
            </NavLink>
          </nav>

          {/* Backend Connection Health Badge */}
          <div className="flex items-center">
            <BackendStatusBadge />
          </div>
        </div>
      </div>
    </header>
  );
};
