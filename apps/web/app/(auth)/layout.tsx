import { Footer } from "@/src/widgets/layout/footer";
import { Navbar } from "@/src/widgets/layout/navbar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-50">{children}</main>
      <Footer />
    </>
  );
}
