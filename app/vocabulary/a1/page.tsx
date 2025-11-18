// app/vocabulary/a1/page.tsx
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import VocabularyLessonCard from "../../../components/VocabularyLessonCard";
import VocabularyDragGame from "../../../components/VocabularyDragGame";
import Link from "next/link";

const a1VocabularyLessons = [
  {
    title: "COMMON THINGS",
    imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=250&fit=crop",
  },
  {
    title: "COMMON VERBS",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop",
  },
  {
    title: "FAMILY AND RELATIVES",
    imageUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=250&fit=crop",
  },
  {
    title: "DESCRIBING PEOPLE & THINGS",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop",
  },
  {
    title: "DAILY ROUTINES",
    imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=250&fit=crop",
  },
  {
    title: "DAYS, MONTHS, SEASONS, DATES",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop",
  },
];

export default function A1VocabularyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Blue Gradient Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold uppercase">A1 Vocabulary Lessons</h1>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/#vocabulary" className="hover:text-blue-600">
              Vocabulary
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">A1 Vocabulary Lessons</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {a1VocabularyLessons.map((lesson, index) => (
            <VocabularyLessonCard
              key={index}
              level="A1"
              levelLabel="ELEMENTARY"
              title={lesson.title}
              imageUrl={lesson.imageUrl}
              href={`/vocabulary/a1/${lesson.title.toLowerCase().replace(/\s+/g, "-").replace(/[&]/g, "")}`}
            />
          ))}
        </div>

        <VocabularyDragGame />
      </main>

      <Footer />
    </div>
  );
}

