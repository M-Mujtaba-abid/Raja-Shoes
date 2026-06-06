import Sidebar from "@/components/Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar />
      <main className="flex-1 ml-56 p-6">{children}</main>
    </div>
  );
}
