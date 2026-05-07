import { Footer } from "@/src/widgets/layout/footer";
import { Navbar } from "@/src/widgets/layout/navbar";

export default function LocalizedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-100">{children}</main>
      <Footer />
    </>
  );
}
