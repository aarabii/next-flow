"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarContent,
  SidebarGroup,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
  SidebarInput,
} from "@/components/ui/sidebar";
import {
  PanelRightOpen,
  PanelLeftOpen,
  Plus,
  LayoutDashboard,
  Settings,
  LogOut,
  GitBranch,
  type LucideIcon,
  Search,
  X,
} from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";

type NavigationItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  items?: {
    title: string;
    url: string;
  }[];
};

const navigationData: NavigationItem[] = [
  {
    title: "Create Flow",
    url: "#",
    icon: Plus,
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Flows",
    url: "/flows",
    icon: GitBranch,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export const Navigation = () => {
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isPending, setIsPending] = React.useState(false);
  const [workflows, setWorkflows] = React.useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await fetch("/api/workflows");
        if (response.ok) {
          const data = await response.json();
          setWorkflows(data);
        }
      } catch (error) {
        console.error("Error fetching workflows in navigation:", error);
      }
    };
    fetchWorkflows();
  }, [pathname]);

  const filteredWorkflows = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    return workflows.filter((flow) =>
      flow.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [workflows, searchQuery]);

  const handleCreate = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPending) return;
    setIsPending(true);
    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to create workflow");
      }

      const data = await response.json();
      router.push(`/workflows/${data.id}`);
    } catch (error) {
      console.error("Error creating workflow:", error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/50 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={toggleSidebar}
              className="w-full hover:bg-sidebar-accent cursor-pointer flex items-center justify-between group-data-[collapsible=icon]:justify-center"
            >
              {isCollapsed ? (
                <div className="flex w-full items-center justify-center">
                  <PanelRightOpen className="size-5 text-muted-foreground animate-in fade-in zoom-in duration-200" />
                </div>
              ) : (
                <>
                  <div className="flex items-center">
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <strong className="truncate font-semibold text-foreground font-secondary">
                        NextFlow
                      </strong>
                      <span className="truncate text-xs text-muted-foreground">
                        Workflow Editor
                      </span>
                    </div>
                  </div>
                  <PanelLeftOpen className="size-4 text-muted-foreground" />
                </>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Search Bar */}
        {!isCollapsed && (
          <div className="px-3 pt-3 pb-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <SidebarInput
                type="text"
                placeholder="Search flows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-7 text-xs h-8 bg-zinc-50 border-zinc-200 focus:bg-white rounded-lg focus-visible:ring-1 focus-visible:ring-purple-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-semibold p-0.5 hover:bg-zinc-150 rounded cursor-pointer border-0 bg-transparent flex items-center justify-center"
                  title="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchQuery && !isCollapsed && (
          <SidebarGroup className="py-1">
            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-3 py-1.5 select-none">
              Search Results
            </div>
            <SidebarMenu className="gap-1 px-2">
              {filteredWorkflows.length > 0 ? (
                filteredWorkflows.map((flow) => (
                  <SidebarMenuItem key={flow.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === `/workflows/${flow.id}`}
                      tooltip={flow.name}
                      className="h-8"
                    >
                      <a
                        href={`/workflows/${flow.id}`}
                        className="font-medium flex items-center gap-2 text-xs truncate w-full"
                      >
                        <GitBranch className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                        <span className="truncate">{flow.name}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="text-[10px] text-zinc-450 px-3 py-1 select-none font-medium">
                  No matching flows
                </div>
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarMenu className="gap-1 px-2 py-2">
            {navigationData.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.url;

              if (item.title === "Create Flow") {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={handleCreate}
                      disabled={isPending}
                      tooltip={item.title}
                      className="group-data-[collapsible=icon]:justify-center cursor-pointer disabled:opacity-50"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden font-medium">
                        {isPending ? "Creating..." : item.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                    className="group-data-[collapsible=icon]:justify-center"
                  >
                    <a
                      href={item.url}
                      className="font-medium flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </a>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub className="ml-0 border-l-0 px-1.5 group-data-[collapsible=icon]:hidden">
                      {item.items.map((subItem) => {
                        const isSubActive = pathname === subItem.url;
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubActive}
                            >
                              <a href={subItem.url}>{subItem.title}</a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
                  tooltip={user?.fullName || "User Account"}
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user?.imageUrl}
                      alt={user?.fullName || "User Avatar"}
                    />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-medium">
                      {user?.firstName?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">
                      {user?.fullName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={8}
              >
                <div className="flex items-center gap-2 px-1.5 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user?.imageUrl}
                      alt={user?.fullName || "User Avatar"}
                    />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-medium">
                      {user?.firstName?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user?.fullName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <SignOutButton>
                  <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer flex items-center gap-2">
                    <LogOut className="size-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </SignOutButton>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
