// components/LessonCard.tsx

import LevelBadge from "./LevelBadge";

type LessonCardProps = {
  level: string;
  skill: string;
  title: string;
  description: string;
};

const LessonCard = ({ level, skill, title, description }: LessonCardProps) => {
  return (
    <article className="bg-white rounded-2xl shadow p-4 text-sm hover:shadow-md transition-shadow">
      <p className="text-xs text-slate-500 mb-1">
        {level} • {skill}
      </p>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-xs text-slate-600">{description}</p>
    </article>
  );
};

export default LessonCard;
