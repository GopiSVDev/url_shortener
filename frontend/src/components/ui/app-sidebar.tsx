import * as React from "react";
import {
  BarChartIcon,
  LayoutDashboardIcon,
  HomeIcon,
  LogOut,
  ListChecks,
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
import { Link, useLocation } from "react-router-dom";

const data = {
  navSecondary: [
    {
      title: "Sign Out",
      url: "#",
      icon: LogOut,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const path = location.pathname;

  const navMain = path.startsWith("/dashboard")
    ? [
        {
          title: "Home",
          url: "/",
          icon: HomeIcon,
        },
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboardIcon,
        },
        {
          title: "Analytics",
          url: "#",
          icon: BarChartIcon,
        },
      ]
    : [
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
          title: "Analytics",
          url: "#",
          icon: BarChartIcon,
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
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
