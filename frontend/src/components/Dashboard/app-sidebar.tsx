import * as React from "react";
import {
  BarChartIcon,
  LayoutDashboardIcon,
  HomeIcon,
  LogOut,
} from "lucide-react";

import { NavMain } from "@/components/Dashboard/nav-main";
import { NavSecondary } from "@/components/Dashboard/nav-secondary";
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

const data = {
  navMain: [
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
  ],
  navSecondary: [
    {
      title: "Sign Out",
      url: "#",
      icon: LogOut,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
