// app/vocabulary/a1/common-things/page.tsx
import Link from "next/link";
import Footer from "../../../../components/Footer";
import Navbar from "../../../../components/Navbar";
import VocabularyDragGame from "../../../../components/VocabularyDragGame";

export default function CommonThingsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8">
        <div className="max-w-5xl mx-auto px-4 space-y-2">
          <p className="uppercase text-xs tracking-[0.3em] text-white/70">A1 Vocabulary</p>
          <h1 className="text-3xl md:text-4xl font-bold">Common Things</h1>
          <p className="text-sm md:text-base text-white/90 max-w-2xl">
            Match daily actions with their Vietnamese meanings. Drag each colored tile into the correct box
            to reinforce essential routines vocabulary.
          </p>
          <div className="text-sm">
            <Link href="/" className="text-white/80 hover:text-white">
              Home
            </Link>{" "}
            /{" "}
            <Link href="/#vocabulary" className="text-white/80 hover:text-white">
              Vocabulary
            </Link>{" "}
            /{" "}
            <Link href="/vocabulary/a1" className="text-white/80 hover:text-white">
              A1
            </Link>{" "}
            / <span className="font-semibold">Common Things</span>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto flex-1 px-4 py-10 space-y-8">
        <div className="bg-white rounded-2xl shadow p-6 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">How to play</h2>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
            <li>Drag a colored tile from the top area.</li>
            <li>Drop it onto the Vietnamese meaning that matches.</li>
            <li>Click “Nộp câu trả lời” to check your score.</li>
            <li>Use “Làm lại” to start over if you want to keep practicing.</li>
          </ul>
        </div>

        <VocabularyDragGame title="Common Things Game" />
      </main>

      <Footer />
    </div>
  );
}


