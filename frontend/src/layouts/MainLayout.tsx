import { AppSidebar } from "@/components/ui/app-sidebar";
import { SiteHeader } from "@/components/ui/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { Outlet, useLocation } from "react-router-dom";
import { ModeToggle } from "@/components/ui/ThemeToggle";
import { useEffect, useState } from "react";

const MainLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const location = useLocation();

  const routeLabels: Record<string, string> = {
    "/": "Home",
    "/dashboard": "Dashboard",
    "/auth": "Login or Register",
    "/features": "Features",
    "/dashboard/urls": "All Urls",
    "/dashboard/analytics": "Analytics",
  };

  const title = routeLabels[location.pathname] || "Page";

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex justify-between items-center">
          <SiteHeader title={title} />
          <ModeToggle />
        </div>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <main>
                <Outlet />
              </main>
              <div className="px-4 lg:px-6"></div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default MainLayout;
