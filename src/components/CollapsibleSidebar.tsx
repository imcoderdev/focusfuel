"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineHome,
  HiOutlineFaceSmile, 
  HiOutlineListBullet, 
  HiOutlineClock, 
  HiOutlineChartBarSquare, 
  HiOutlineUser, 
  HiOutlinePlus,
  HiOutlineQuestionMarkCircle,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight
} from "react-icons/hi2";
import { PiTreeEvergreen } from "react-icons/pi";
import { useRouter, usePathname } from "next/navigation";
import { useSupabaseAuth } from "@/components/AuthProvider";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CollapsibleSidebarProps {
  onAddTask: () => void;
}

export interface CollapsibleSidebarRef {
  toggleSidebar: () => void;
}

const navItems: NavItem[] = [
  { name: "Home", href: "/dashboard", icon: HiOutlineHome },
  { name: "Daily Check-in", href: "/dashboard/mood", icon: HiOutlineFaceSmile },
  { name: "AI Task Planner", href: "/dashboard/tasks", icon: HiOutlineListBullet },
  { name: "Focus Session", href: "/dashboard/focus", icon: HiOutlineClock },
  { name: "My Forest", href: "/dashboard/forest", icon: PiTreeEvergreen },
  { name: "Analytics", href: "/dashboard/progress", icon: HiOutlineChartBarSquare },
  { name: "User Profile", href: "/dashboard/profile", icon: HiOutlineUser },
];

const CollapsibleSidebar = forwardRef<CollapsibleSidebarRef, CollapsibleSidebarProps>(({ onAddTask }, ref) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const pathname = usePathname();
  const { user } = useSupabaseAuth();

  // Fetch user profile data including uploaded avatar
  useEffect(() => {
    async function fetchUserProfile() {
      if (!user?.email) return;
      
      try {
        const response = await fetch(`/api/user/profile-final?userEmail=${encodeURIComponent(user.email)}`);
        if (response.ok) {
          const profileData = await response.json();
          setUserProfile(profileData);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    }
    
    fetchUserProfile();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      fetchUserProfile();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [user?.email]);

  // Get user display name and avatar
  const getUserDisplayName = () => {
    if (!user) return "User";
    
    // Use profile data first, then fallback to auth metadata
    const name = userProfile?.name ||
                 user.user_metadata?.full_name || 
                 user.user_metadata?.name || 
                 user.email?.split('@')[0] || 
                 "User";
    return name;
  };

  const getUserAvatar = () => {
    if (!user) return null;
    
    // Debug: Log user metadata to console
    console.log('User object:', user);
    console.log('User metadata:', user.user_metadata);
    console.log('User profile from DB:', userProfile);
    
    // Try profile data first (uploaded images), then OAuth provider avatars
    const avatar = userProfile?.image ||
                   userProfile?.avatar_url ||
                   user.user_metadata?.avatar_url || 
                   user.user_metadata?.picture ||
                   user.user_metadata?.image ||
                   user.identities?.[0]?.identity_data?.avatar_url ||
                   user.identities?.[0]?.identity_data?.picture ||
                   null;
    
    console.log('Found avatar URL:', avatar);
    return avatar;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = getUserDisplayName();
  const avatarUrl = getUserAvatar();
  const initials = getInitials(displayName);

  // Expose the toggle function to parent components
  useImperativeHandle(ref, () => ({
    toggleSidebar: () => {
      console.log('Toggle sidebar called, current state:', { isCollapsed, isMobile });
      setIsCollapsed(prev => !prev);
    }
  }));

  // Handle mobile detection and responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      const wasMobile = isMobile;
      setIsMobile(mobile);
      
      // Only auto-collapse when transitioning from desktop to mobile
      if (mobile && !wasMobile && !isCollapsed) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile, isCollapsed]);

  // Update CSS custom property for main content margin
  useEffect(() => {
    const width = isMobile ? 0 : (isCollapsed ? 80 : 256);
    document.documentElement.style.setProperty(
      '--sidebar-width', 
      `${width}px`
    );
  }, [isCollapsed, isMobile]);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              console.log('Overlay clicked, closing sidebar');
              setIsCollapsed(true);
            }}
            className="fixed inset-0 bg-black/50 z-[9998] md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          width: isMobile ? 256 : (isCollapsed ? 80 : 256),
          x: isMobile && isCollapsed ? -256 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`h-screen flex flex-col justify-between p-4 transition-all duration-300 ease-in-out bg-[#1C2333] border-r border-slate-700/50 fixed ${
          isMobile ? 'z-[9999]' : 'z-50'
        }`}
        style={{ 
          top: 0,
          left: 0,
          maxWidth: isMobile ? '80vw' : undefined,
        }}
      >
      {/* Top Section - Logo and User Profile */}
      <div className="flex flex-col space-y-4">
        {/* User Profile */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden relative">
            {avatarUrl ? (
              <>
                <img 
                  src={avatarUrl} 
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.initials-fallback') as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <span className="initials-fallback absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
                  {initials}
                </span>
              </>
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col min-w-0"
              >
                <span className="text-white font-semibold text-sm truncate">{displayName}</span>
                <span className="text-slate-400 text-xs truncate">{userProfile?.email || user?.email || 'User'}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Add Task Button */}
        <motion.button
          onClick={onAddTask}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
          style={{ 
            height: '44px',
            padding: isCollapsed ? '0' : '0 16px'
          }}
        >
          <HiOutlinePlus className="text-xl" />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm whitespace-nowrap overflow-hidden"
              >
                Add Task
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.02, x: 2 }}
                  className={`flex items-center rounded-md p-2 cursor-pointer transition-all duration-200 ${
                    isActive 
                      ? 'bg-emerald-500/10 border-l-4 border-emerald-400 text-white' 
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                  }`}
                  style={{ 
                    marginLeft: isActive ? '0' : '4px',
                    paddingLeft: isActive ? '8px' : '12px'
                  }}
                >
                  <Icon className="text-xl flex-shrink-0" />
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col space-y-3">
        {/* Help Link */}
        <div className="flex items-center text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer">
          <HiOutlineQuestionMarkCircle className="text-lg" />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="ml-3 text-sm"
              >
                Help & Resources
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle Button */}
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center w-full h-10 rounded-md bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white transition-all duration-200"
        >
          {isCollapsed ? (
            <HiOutlineChevronDoubleRight className="text-lg" />
          ) : (
            <HiOutlineChevronDoubleLeft className="text-lg" />
          )}
        </motion.button>
      </div>
    </motion.aside>
    </>
  );
});

CollapsibleSidebar.displayName = "CollapsibleSidebar";

export default CollapsibleSidebar;
