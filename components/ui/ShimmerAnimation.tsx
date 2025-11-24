type ShimmerAnimationProps = {
  showBalance?: boolean;
};

const ShimmerAnimation = ({ showBalance = false }: ShimmerAnimationProps) => {
  return (
    <div className="flex items-center gap-3 p-2 rounded-xl bg-input/50 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-700/50" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-700/50 rounded w-16" />
        <div className="h-3 bg-gray-700/50 rounded w-24" />
      </div>
      {showBalance && <div className="w-16 h-4 bg-gray-700/50 rounded" />}
    </div>
  );
};

export default ShimmerAnimation;
