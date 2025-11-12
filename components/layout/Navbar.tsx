import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";

const Navbar = () => {
  return (
    <header className="w-full px-6 py-4 top-0 sticky bg-transparent">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo and App Name */}
        <div className="flex gap-x-3 items-center">
          <Image
            src={"/logo.png"}
            alt="Logo"
            height={40}
            width={40}
            quality={100}
            priority
          />
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              ERC20 Transfer
            </h1>
            <p className="text-xs text-secondary font-semibold tracking-wide">
              SECURE TOKEN TRANSFERS
            </p>
          </div>
        </div>
        {/* Theme toggle and Connect Button */}
        <div className="flex gap-x-3 items-center">
          <ConnectButton showBalance={false} />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
