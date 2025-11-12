import Navbar from "@/components/layout/Navbar";
import TransferCard from "@/components/main/TransferCard";

export default function Home() {
  return (
    <main className="flex flex-col bg-background h-screen">
      <Navbar />
      <div className="flex flex-col items-center justify-start flex-1 relative pt-20">
        <h1 className="text-7xl font-bold text-foreground text-center mb-12">
          Transfer Tokens with Ease
        </h1>
        <div className="w-full max-w-[480px] mx-auto space-y-6 relative">
          <div className="blur-gradient" />
          <div className="relative z-10">
            <TransferCard />
          </div>
        </div>
      </div>
    </main>
  );
}
