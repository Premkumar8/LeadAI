"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Contact2, 
  KanbanSquare, 
  Video, 
  CheckSquare, 
  Bot, 
  BarChart3, 
  Settings as SettingsIcon, 
  LogOut, 
  User, 
  Sparkles,
  Menu,
  X,
  Sun,
  Moon,
  Receipt
} from "lucide-react";
import { api } from "@/lib/api";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [unpaidCount, setUnpaidCount] = useState(0);

  const publicPages = ["/login", "/register"];
  const isPublicPage = publicPages.includes(pathname);

  useEffect(() => {
    const savedTheme = localStorage.getItem("avanta_theme") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("avanta_theme", newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("avanta_token");
    const storedUser = localStorage.getItem("avanta_user");

    if (!token && !isPublicPage) {
      router.push("/login");
    } else if (token) {
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      // Optional: Verify token freshness on backend
      api.auth.getMe().then((userData) => {
        setUser(userData);
        localStorage.setItem("avanta_user", JSON.stringify(userData));
      }).catch(() => {
        if (!isPublicPage) {
          api.auth.logout();
          router.push("/login");
        }
      });
    }
    setLoading(false);
  }, [pathname, isPublicPage, router]);

  const fetchUnpaidCount = async () => {
    try {
      const token = localStorage.getItem("avanta_token");
      if (!token) return;
      const txs = await api.transactions.list();
      const unpaid = txs.filter((t: any) => t.status === "Unpaid").length;
      setUnpaidCount(unpaid);
    } catch (err) {
      console.error("Failed to fetch unpaid transactions for badge:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("avanta_token");
    if (token) {
      fetchUnpaidCount();
      const interval = setInterval(fetchUnpaidCount, 15000);
      return () => clearInterval(interval);
    }
  }, [pathname]);

  const handleLogout = () => {
    api.auth.logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Securing session...</p>
        </div>
      </div>
    );
  }

  // Render children directly without sidebar/nav if it's a public page (Login/Register)
  if (isPublicPage) {
    return <>{children}</>;
  }

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Leads Pipeline", href: "/leads", icon: Users },
    { name: "Kanban Board", href: "/pipeline", icon: KanbanSquare },
    { name: "Companies", href: "/companies", icon: Building2 },
    { name: "Contacts", href: "/contacts", icon: Contact2 },
    { name: "Meetings AI", href: "/meetings", icon: Video },
    { name: "Action Tasks", href: "/tasks", icon: CheckSquare },
    { name: "AI Sales Assistant", href: "/assistant", icon: Bot, highlight: true },
    { name: "Credit & Debit", href: "/finance", icon: Receipt },
    { name: "Analytics & ML", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      {/* Mobile Toggle header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center font-bold text-white shadow-md">
            A
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
            Avanta
          </span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white focus:outline-none"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar - Desktop & Mobile overlay */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-slate-950/80 backdrop-blur-xl border-r border-slate-900 z-50 transform lg:transform-none transition-transform duration-200 ease-in-out
        flex flex-col justify-between shadow-neon-accent
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div>
          {/* Sidebar Logo */}
          <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-900">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/10">
              A
            </div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              AVANTA
            </span>
            <span className="text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full px-2 py-0.5 ml-2">
              SaaS
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                    ${isActive 
                      ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/15 font-semibold" 
                      : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-100"
                    }
                    ${item.highlight ? "border border-cyan-500/20 bg-cyan-500/5" : ""}
                  `}
                >
                  <Icon size={18} className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-100"}`} />
                  <span className="flex-1">{item.name}</span>
                  {item.highlight && (
                    <span className="flex items-center gap-0.5 text-[10px] text-cyan-300 font-bold bg-cyan-500/20 px-1.5 py-0.5 rounded-full">
                      <Sparkles size={8} className="animate-pulse" /> AI
                    </span>
                  )}
                  {item.href === "/finance" && unpaidCount > 0 && (
                    <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full animate-pulse shadow-md shadow-rose-500/20">
                      {unpaidCount} Alert
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile details at the bottom of the sidebar */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-100 truncate">{user?.name || "Agent User"}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || "admin@avanta.ai"}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="lg:hidden w-full flex items-center justify-center gap-2 px-4 py-2 mb-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-900 border border-slate-900 transition-colors duration-200 cursor-pointer"
          >
            {theme === "dark" ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-cyan-400" />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <button
            onClick={handleLogout}
            className="lg:hidden w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-455 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-slate-900 transition-colors duration-200 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Desktop Top Header */}
        <header className="hidden lg:flex h-16 border-b border-slate-900 bg-slate-950/40 backdrop-blur-md items-center justify-between px-8 sticky top-0 z-35">
          <div className="flex items-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              {pathname === "/dashboard" ? "Overview" : pathname.substring(1).replace("-", " ")}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-slate-100 border border-slate-900/60 bg-slate-950/50 transition-colors duration-200 cursor-pointer"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-cyan-400" />}
            </button>
            
            <div className="h-5 w-px bg-slate-900"></div>

            {/* Logged in user info */}
            <div className="flex flex-col items-end justify-center">
              <span className="text-xs font-bold text-slate-200">{user?.name || "Agent User"}</span>
              <span className="text-[10px] text-slate-500">{user?.email || "admin@avanta.ai"}</span>
            </div>

            <div className="h-5 w-px bg-slate-900"></div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-350 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-slate-900/65 bg-slate-950/50 transition-all duration-200 cursor-pointer"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 pt-20 lg:pt-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
