import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  return (
    <main className="flex items-center justify-center flex-col gap-y-2 h-screen">
      <h1>Welcome to ERCTransfer</h1>
      <p>A dApp to transfer ERC20 tokens with ease.</p>
      <ConnectButton />
    </main>
  );
}
