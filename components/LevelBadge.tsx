// components/LevelBadge.tsx

type LevelBadgeProps = {
    level: string;
  };
  
  const LevelBadge = ({ level }: LevelBadgeProps) => {
    return (
      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
        {level}
      </span>
    );
  };
  
  export default LevelBadge;
  