// src/components/Layout.tsx
import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { useI18n } from "@/i18n/i18n";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Calendar,
  Users,
  User,
  type LucideIcon,
  ChevronLeft,
} from "lucide-react";

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  actions?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  showBackButton = false,
  actions,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  const navItems: NavItem[] = [
    { icon: Home, label: t('nav.home'), path: "/student/main" },
    { icon: Calendar, label: t('nav.schedule'), path: "/student/schedule" },
    { icon: Users, label: t('nav.clubs'), path: "/student/clubs" },
    { icon: User, label: t('nav.profile'), path: "/student/profile" },
  ];

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!title) return;

    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsScrolled(scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [title]);

  return (
    <div className="min-h-screen bg-[#FAFBFF] flex flex-col">
      {/* Header */}
      {title && (
        <header className={clsx(
          "sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 overflow-hidden",
          "transition-[padding-top] duration-300 ease-out will-change-[padding-top]",
          (showBackButton || isScrolled) ? "pt-20" : "pt-0"
        )}>
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {showBackButton && (
                  <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-[#6B7280] hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <h1 className="text-[22px] font-semibold text-[#111827] tracking-tight">{title}</h1>
              </div>
              {actions && (
                <div className="flex items-center gap-2">{actions}</div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-20">
        <div className="flex justify-around pt-2 pb-5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  relative flex flex-col items-center py-2 px-3 rounded-xl
                  transition-all duration-300 ease-out
                  ${
                    isActive
                      ? "text-[#1E3A8A] scale-105"
                      : "text-[#9CA3AF] hover:text-[#6B7280] hover:scale-105"
                  }
                `}
              >
                <div className={`transition-transform duration-300 ${isActive ? 'translate-y-[-2px]' : ''}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} className={isActive ? 'drop-shadow-sm' : ''} />
                </div>
                <span
                  className={`text-[11px] mt-1 transition-all duration-300 ${
                    isActive 
                      ? "font-bold text-[#1E3A8A]" 
                      : "font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

// Page Container for consistent padding
export const PageContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return <div className={`px-4 py-4 ${className}`}>{children}</div>;
};

// Section Header Component
interface SectionHeaderProps {
  title: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  action,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[17px] font-semibold text-[#111827]">{title}</h2>
      {action && (
        <button
          onClick={action.onClick}
          className="text-[13px] text-[#1E3A8A] hover:text-[#1E3A8A] font-medium flex items-center gap-1"
        >
          {action.icon && <action.icon size={16} />}
          {action.label}
        </button>
      )}
    </div>
  );
};

// Card component — shared wrapper
export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = "", onClick }) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-white rounded-[16px] p-[18px]",
        "shadow-[0_4px_14px_rgba(0,0,0,0.05)]",
        onClick && "cursor-pointer hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-shadow duration-200",
        className,
      )}
    >
      {children}
    </div>
  );
};
