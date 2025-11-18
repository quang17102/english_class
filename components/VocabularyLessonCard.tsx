// components/VocabularyLessonCard.tsx
import Link from "next/link";

type VocabularyLessonCardProps = {
  level: string;
  levelLabel: string;
  title: string;
  imageUrl?: string;
  href?: string;
};

const VocabularyLessonCard = ({
  level,
  levelLabel,
  title,
  imageUrl = "https://via.placeholder.com/400x250?text=" + encodeURIComponent(title),
  href = "#",
}: VocabularyLessonCardProps) => {
  return (
    <Link href={href} className="block group">
      <article className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image Area */}
        <div className="relative h-56 bg-gradient-to-br from-slate-100 to-slate-200">
          {/* Placeholder for image - you can replace with actual image */}
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${imageUrl})`,
            }}
          >
            {/* Level Badge - Top Right with circular design */}
            <div className="absolute top-3 right-3">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16" viewBox="0 0 64 64">
                  <defs>
                    <path
                      id="circle-path"
                      d="M 32,32 m -24,0 a 24,24 0 1,1 48,0 a 24,24 0 1,1 -48,0"
                    />
                  </defs>
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth="3"
                  />
                  <text
                    x="32"
                    y="24"
                    textAnchor="middle"
                    fill="white"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="Arial, sans-serif"
                  >
                    {level}
                  </text>
                  <text
                    x="32"
                    y="36"
                    textAnchor="middle"
                    fill="white"
                    fontSize="7"
                    fontWeight="500"
                    fontFamily="Arial, sans-serif"
                  >
                    {levelLabel}
                  </text>
                  <text fill="white" fontSize="5" fontFamily="Arial, sans-serif" opacity="0.8">
                    <textPath href="#circle-path" startOffset="50%">
                      <tspan dy="2">test-english.com</tspan>
                    </textPath>
                  </text>
                </svg>
              </div>
            </div>

            {/* Title Overlay - Blue Background */}
            <div className="absolute bottom-0 left-0 right-0 bg-blue-600 px-4 py-2.5">
              <h3 className="text-white font-bold text-sm uppercase tracking-wide">{title}</h3>
            </div>
          </div>
        </div>

        {/* Footer Bar - Blue */}
        <div className="bg-blue-600 px-4 py-2 flex items-center justify-between">
          <div className="text-white text-xs font-semibold">AZ</div>
          <div className="text-white text-[10px]">test-english.com</div>
        </div>

        {/* Text Description */}
        <div className="p-4">
          <p className="text-sm text-gray-700 font-medium">
            {title.replace(/\s+/g, " ")} - {level} English Vocabulary
          </p>
        </div>
      </article>
    </Link>
  );
};

export default VocabularyLessonCard;

