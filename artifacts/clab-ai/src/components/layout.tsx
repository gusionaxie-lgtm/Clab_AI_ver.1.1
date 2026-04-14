import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { 
  LayoutDashboard, 
  FolderGit2, 
  BarChart3, 
  Activity, 
  LogOut, 
  Terminal,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: FolderGit2 },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      {/* Mobile header */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <div className="flex items-center gap-2 text-primary">
          <Terminal className="h-6 w-6" />
          <span className="font-mono text-lg font-bold tracking-tighter">CLAB_AI</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-card transition-transform duration-200 ease-in-out md:static md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          <div className="hidden h-16 items-center gap-2 border-b border-border px-6 text-primary md:flex">
            <Terminal className="h-6 w-6" />
            <span className="font-mono text-lg font-bold tracking-tighter">CLAB_AI</span>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-3">
              {navigation.map((item) => {
                const isActive = location === item.href || location.startsWith(`${item.href}/`);
                return (
                  <Link key={item.name} href={item.href}>
                    <span className={cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
                      isActive 
                        ? "bg-primary/10 text-primary glow-green" 
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    )}>
                      <item.icon className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-mono text-xs border border-primary/30">
                {user?.firstName?.charAt(0) || "U"}
              </div>
              <div className="flex flex-col truncate">
                <span className="truncate text-sm font-medium text-foreground">
                  {user?.fullName || user?.primaryEmailAddress?.emailAddress}
                </span>
                <span className="truncate text-xs text-muted-foreground font-mono">
                  {user?.primaryEmailAddress?.emailAddress}
                </span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="mt-2 w-full justify-start text-muted-foreground hover:text-foreground hover:bg-white/5" 
              onClick={() => signOut()}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
