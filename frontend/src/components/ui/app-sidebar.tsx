import * as React from "react";
import {
  BarChartIcon,
  LayoutDashboardIcon,
  HomeIcon,
  LogOut,
  ListChecks,
  LogIn,
  Link as Link2,
} from "lucide-react";

import { NavMain } from "@/components/ui/nav-main";
import { NavSecondary } from "@/components/ui/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isAuthenticated, logout } = useAuth();

  const navMain = [
    {
      title: "Home",
      url: "/",
      icon: HomeIcon,
    },
    {
      title: "Features",
      url: "/features",
      icon: ListChecks,
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "My Urls",
      url: "/dashboard/urls",
      icon: Link2,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: BarChartIcon,
    },
  ];

  const navSecondary = isAuthenticated
    ? [
        {
          title: "Log Out",
          icon: LogOut,
          onClick: () => logout(),
        },
      ]
    : [
        {
          title: "Login / Sign Up",
          url: "/auth",
          icon: LogIn,
        },
      ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/">
                <div className="font-bold text-xl flex gap-2 items-center">
                  <img
                    src="/assets/icons/link.svg"
                    alt="Logo Icon"
                    className="w-6 h-6"
                  />
                  Shortener
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
