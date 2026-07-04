import { Sidebar } from "@/components/layout/sidebar";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 min-h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Page Viewport */}
      <div className="flex-1 flex flex-col overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl animate-fade-in">
          <AuthGuard>
            {children}
          </AuthGuard>
        </div>
      </div>
    </div>
  );
}
