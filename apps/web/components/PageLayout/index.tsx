import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";

export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>
        {children}
        <Toaster />
      </main>
      <Footer />
    </>
  );
}
