import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";
import { titleForPath } from "./pageTitles";

export function AppShell() {
  const { pathname } = useLocation();
  const title = titleForPath(pathname);

  return (
    <div className="min-h-screen flex bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-sage focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar title={title} />
        <main id="main-content" className="flex-1 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-12 content-max w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
