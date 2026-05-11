import { Footer } from "@/src/widgets/layout/footer";
import { Navbar } from "@/src/widgets/layout/navbar";

export default function LocalizedPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">{children}</main>
      <Footer />
    </>
  );
}
