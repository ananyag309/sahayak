
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { auth } from "@/lib/firebase";
import {
  BookOpen,
  BrainCircuit,
  ClipboardList,
  Gamepad2,
  Home,
  Laptop,
  Layers,
  LayoutTemplate,
  Library,
  LogOut,
  Mic,
  Minus,
  Moon,
  Plus,
  ScanLine,
  Sun,
  Wand2,
} from "lucide-react";
import { useTheme } from "next-themes";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/dashboard/chat", icon: BrainCircuit, label: "AI Chat" },
  { href: "/dashboard/scanner", icon: ScanLine, label: "Textbook Scanner" },
  { href: "/dashboard/diagram", icon: LayoutTemplate, label: "Diagram Generator" },
  { href: "/dashboard/reading", icon: Mic, label: "Reading Assessment" },
  { href: "/dashboard/planner", icon: BookOpen, label: "Lesson Planner" },
  { href: "/dashboard/homework", icon: ClipboardList, label: "Homework Generator" },
  { href: "/dashboard/games", icon: Gamepad2, label: "Game Generator" },
  { href: "/dashboard/flashcards", icon: Layers, label: "Flashcard Creator" },
  { href: "/dashboard/library", icon: Library, label: "My Library" },
  { href: "/dashboard/agent", icon: Wand2, label: "Curriculum Agent" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const [fontSize, setFontSize] = useState('base');

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const savedSize = localStorage.getItem('fontSize') || 'base';
    document.documentElement.classList.remove('font-sm', 'font-lg');
    if (savedSize === 'sm') document.documentElement.classList.add('font-sm');
    if (savedSize === 'lg') document.documentElement.classList.add('font-lg');
    setFontSize(savedSize);
  }, []);

  const handleFontSizeChange = (direction: 'increase' | 'decrease') => {
    const newSize = fontSize === 'sm' && direction === 'increase' ? 'base' :
                  fontSize === 'base' && direction === 'increase' ? 'lg' :
                  fontSize === 'lg' && direction === 'decrease' ? 'base' :
                  fontSize === 'base' && direction === 'decrease' ? 'sm' :
                  fontSize;
    
    document.documentElement.classList.remove('font-sm', 'font-lg');
    if (newSize !== 'base') {
        document.documentElement.classList.add(`font-${newSize}`);
    }
    localStorage.setItem('fontSize', newSize);
    setFontSize(newSize);
  };


  const handleSignOut = () => {
    sessionStorage.removeItem('isDemoMode');
    if (auth) {
        auth.signOut();
    } else {
        router.push('/login');
    }
  };

  if (loading || !user) {
    return null;
  }
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <SidebarProvider>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground">
        Skip to main content
      </a>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <span>
                      <item.icon />
                      <span>{item.label}</span>
                    </span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="justify-start gap-2 w-full px-2" aria-label={`Open user menu for ${user.displayName || user.email}`}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL ?? ''} />
                  <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{user.displayName || user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="ml-6">Theme</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme('light')}>
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Light</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')}>
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Dark</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('system')}>
                      <Laptop className="mr-2 h-4 w-4" />
                      <span>System</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-transparent">
                  <div className="flex items-center justify-between w-full">
                      <span>Font Size</span>
                      <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleFontSizeChange('decrease')} disabled={fontSize === 'sm'}>
                              <Minus className="h-4 w-4" />
                              <span className="sr-only">Decrease font size</span>
                          </Button>
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleFontSizeChange('increase')} disabled={fontSize === 'lg'}>
                              <Plus className="h-4 w-4" />
                              <span className="sr-only">Increase font size</span>
                          </Button>
                      </div>
                  </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/50 backdrop-blur-sm px-6 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
                {/* Could add breadcrumbs here */}
            </div>
        </header>
        <main id="main-content" className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
