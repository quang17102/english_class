// app/page.tsx
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LessonCard from "../components/LessonCard";
import LevelBadge from "../components/LevelBadge";

const latestLessons = [
  {
    level: "C1",
    skill: "Vocabulary",
    title: "Feelings and reactions",
    description: "Advanced vocabulary to talk about emotions, surprises and reactions.",
  },
  {
    level: "C1",
    skill: "Grammar",
    title: "Advanced present tenses",
    description: "Contrast present simple, continuous and stative verbs.",
  },
  {
    level: "C1",
    skill: "Listening",
    title: "When I completely embarrassed myself",
    description: "Listen to a story and answer comprehension questions.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
              Test your English. Learn every day.
            </h1>
            <p className="mb-6 text-sm md:text-base">
              Grammar lessons with clear explanations, vocabulary practice, listening & reading tests,
              instant marking, feedback for every answer and more – all in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#level-test"
                className="bg-white text-blue-700 font-semibold px-5 py-2 rounded-full text-sm hover:bg-slate-100"
              >
                Take a level test
              </a>
              <a
                href="#latest"
                className="border border-white/70 text-white font-semibold px-5 py-2 rounded-full text-sm hover:bg-white/10"
              >
                Explore lessons
              </a>
            </div>
          </div>
          <div className="bg-white/10 rounded-2xl p-5 text-sm">
            <p className="font-semibold mb-2">What would you like to learn today?</p>
            <ul className="grid grid-cols-2 gap-3">
              <li className="bg-white/10 rounded-xl px-3 py-2">Grammar</li>
              <li className="bg-white/10 rounded-xl px-3 py-2">Vocabulary</li>
              <li className="bg-white/10 rounded-xl px-3 py-2">Listening</li>
              <li className="bg-white/10 rounded-xl px-3 py-2">Reading</li>
              <li className="bg-white/10 rounded-xl px-3 py-2">Use of English</li>
              <li className="bg-white/10 rounded-xl px-3 py-2">Writing</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10 flex-1">
        {/* Grammar */}
        <section id="grammar" className="grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h2 className="text-xl font-bold mb-2">Grammar Lessons</h2>
            <p className="text-sm mb-3">
              Study grammar by level. Each lesson includes simple explanations, examples and interactive
              exercises with instant feedback for each question.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {["A1", "A2", "B1", "B1+", "B2", "C1"].map((level) => (
                <LevelBadge key={level} level={level} />
              ))}
            </div>
            <button className="mt-4 text-sm font-semibold text-blue-600 hover:underline">
              Go to grammar lessons →
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-xs">
            <p className="font-semibold mb-2">Example exercise</p>
            <p className="mb-2">Choose the correct option:</p>
            <p className="mb-3 italic">"She ____ to the gym every day."</p>
            <ul className="space-y-1">
              <li>○ go</li>
              <li>● goes</li>
              <li>○ is going</li>
            </ul>
          </div>
        </section>

        {/* Vocabulary */}
        <section id="vocabulary" className="grid md:grid-cols-2 gap-6 items-center">
          <div className="order-2 md:order-1 bg-white rounded-2xl shadow p-4 text-xs">
            <p className="font-semibold mb-2">Example exercise</p>
            <p className="mb-2">Match the word with the definition.</p>
            <ul className="space-y-1">
              <li>
                1. <strong>thrilled</strong> – very happy and excited
              </li>
              <li>
                2. <strong>exhausted</strong> – extremely tired
              </li>
            </ul>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-xl font-bold mb-2">Vocabulary Lessons</h2>
            <p className="text-sm mb-3">
              Grow your vocabulary with level-based topics, pictures and quizzes. Get instant explanations and
              example sentences to make the words stick.
            </p>
            <button className="mt-4 text-sm font-semibold text-blue-600 hover:underline">
              Go to vocabulary lessons →
            </button>
          </div>
        </section>

        {/* Exams & Level Test */}
        <section id="exams" className="grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h2 className="text-xl font-bold mb-2">Exam Practice</h2>
            <p className="text-sm mb-3">
              Prepare for Cambridge, IELTS or TOEFL with exam-style tasks, texts and audio. Learn tips and
              strategies while you practice.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 bg-slate-200 rounded-full">Cambridge A2 Key</span>
              <span className="px-3 py-1 bg-slate-200 rounded-full">Cambridge B1 Preliminary</span>
              <span className="px-3 py-1 bg-slate-200 rounded-full">Cambridge B2 First</span>
              <span className="px-3 py-1 bg-slate-200 rounded-full">IELTS</span>
              <span className="px-3 py-1 bg-slate-200 rounded-full">TOEFL iBT</span>
            </div>
            <button className="mt-4 text-sm font-semibold text-blue-600 hover:underline">
              Go to exam practice →
            </button>
          </div>
          <div id="level-test" className="bg-white rounded-2xl shadow p-4 text-xs">
            <p className="font-semibold mb-1">Online Level Test</p>
            <p className="mb-3">
              60 multiple-choice questions. No time limit. Check your result and see the correct answers at the end.
            </p>
            <button className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700">
              Start level test
            </button>
          </div>
        </section>

        {/* Latest lessons */}
        <section id="latest">
          <h2 className="text-xl font-bold mb-3">Latest lessons &amp; tests</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            {latestLessons.map((lesson, index) => (
              <LessonCard key={index} {...lesson} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
