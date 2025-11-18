// components/VocabularyDragGame.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Card = {
  id: string;
  text: string;
};

type Slot = {
  id: string;
  label: string;
  correctCardId: string;
};

const cards: Card[] = [
  { id: "walk-dog", text: "to walk the dog" },
  { id: "eat-dinner", text: "to have/eat dinner" },
  { id: "feed-pet", text: "to feed the dog/cat" },
  { id: "call-friend", text: "to call a friend/your family" },
  { id: "read-newspaper", text: "to read a newspaper" },
  { id: "go-bed", text: "to go to bed" },
  { id: "go-cafe", text: "to go to a café" },
  { id: "check-email", text: "to check your emails" },
  { id: "buy-groceries", text: "to buy groceries" },
  { id: "listen-radio", text: "to listen to the radio" },
];

const slots: Slot[] = [
  { id: "an-toi", label: "Ăn tối", correctCardId: "eat-dinner" },
  { id: "di-ngu", label: "Đi ngủ", correctCardId: "go-bed" },
  { id: "mua-thuc-pham", label: "Mua thực phẩm, đồ tạp hóa", correctCardId: "buy-groceries" },
  { id: "doc-bao", label: "Đọc báo", correctCardId: "read-newspaper" },
  { id: "kiem-tra-email", label: "Kiểm tra email", correctCardId: "check-email" },
  { id: "di-cafe", label: "Đi quán cà phê", correctCardId: "go-cafe" },
  { id: "nghe-dai", label: "Nghe đài", correctCardId: "listen-radio" },
  { id: "cho-cho", label: "Cho chó/mèo ăn", correctCardId: "feed-pet" },
  { id: "dat-cho-di-dao", label: "Dắt chó đi dạo", correctCardId: "walk-dog" },
  { id: "goi-dien", label: "Gọi điện cho bạn hoặc người thân", correctCardId: "call-friend" },
];

type AnswerMap = Record<string, string | null>;

const createInitialAnswers = (): AnswerMap =>
  slots.reduce((acc, slot) => ({ ...acc, [slot.id]: null }), {});

type VocabularyDragGameProps = {
  title?: string;
};

const VocabularyDragGame = ({ title = "Daily Routines Game" }: VocabularyDragGameProps) => {
  const [answers, setAnswers] = useState<AnswerMap>(createInitialAnswers);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  const usedCardIds = useMemo(
    () => Object.values(answers).filter((value): value is string => Boolean(value)),
    [answers],
  );

  const availableCards = cards.filter((card) => !usedCardIds.includes(card.id));

  const handleDrop = (slotId: string) => {
    if (!isPlaying) return;
    if (!draggingId) return;
    setAnswers((prev) => {
      const newAnswers: AnswerMap = { ...prev };
      // remove card from other slots
      Object.keys(newAnswers).forEach((key) => {
        if (newAnswers[key] === draggingId) {
          newAnswers[key] = null;
        }
      });
      newAnswers[slotId] = draggingId;
      return newAnswers;
    });
  };

  const clearSlot = (slotId: string) => {
    setAnswers((prev) => ({ ...prev, [slotId]: null }));
  };

  const handleSubmit = () => {
    setIsPlaying(false);
    setSubmitted(true);
    setShowResult(true);
    setTimeout(() => setShowResult(false), 2500);
  };

  const handleReset = () => {
    setAnswers(createInitialAnswers());
    setSubmitted(false);
    setShowResult(false);
    setIsPlaying(false);
    setElapsedSeconds(0);
  };

  const handlePlay = () => {
    setAnswers(createInitialAnswers());
    setSubmitted(false);
    setShowResult(false);
    setIsPlaying(true);
    setElapsedSeconds(0);
  };

  const correctCount = useMemo(
    () =>
      slots.filter((slot) => {
        if (!answers[slot.id]) return false;
        return answers[slot.id] === slot.correctCardId;
      }).length,
    [answers],
  );

  useEffect(() => {
    if (!isPlaying) return;
    const timerId = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [isPlaying]);

  const formattedTime = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(
    elapsedSeconds % 60,
  ).padStart(2, "0")}`;

  const disabledOverlay = !isPlaying;

  return (
    <section className="mt-10">
      <div className="bg-slate-900 text-white rounded-t-2xl px-4 py-2 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold tracking-wide uppercase">{title}</div>
          <p className="text-[11px] text-white/70">Nhấn Play để bắt đầu đếm giờ</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="font-mono text-base">{formattedTime}</div>
          <div>
            Score:{" "}
            <span className="font-bold">
              {correctCount}/{slots.length}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white rounded-b-2xl p-4 space-y-4 shadow-lg">
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-2 rounded-full disabled:opacity-40"
            onClick={handlePlay}
            disabled={isPlaying}
          >
            Play
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-5 py-2 rounded-full disabled:opacity-40"
            onClick={handleSubmit}
            disabled={!isPlaying}
          >
            Nộp câu trả lời
          </button>
          <button
            className="border border-white/30 text-white font-semibold px-5 py-2 rounded-full hover:bg-white/10"
            onClick={handleReset}
          >
            Làm lại
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {availableCards.map((card) => (
            <div
              key={card.id}
              draggable={isPlaying}
              onDragStart={() => setDraggingId(card.id)}
              onDragEnd={() => setDraggingId(null)}
              className="relative rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900 font-semibold text-xs md:text-sm uppercase text-center py-3 cursor-grab shadow-[0_5px_15px_rgba(14,165,233,0.4)] hover:scale-[1.02] transition"
            >
              {card.text}
              <button
                type="button"
                className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-white text-slate-900 text-base shadow hover:bg-slate-100"
                onClick={(event) => {
                  event.stopPropagation();
                  speak(card.text);
                }}
                tabIndex={-1}
                aria-label={`Play pronunciation for ${card.text}`}
              >
                🔊
              </button>
            </div>
          ))}
          {availableCards.length === 0 && (
            <p className="col-span-full text-center text-xs text-slate-300">
              All cards placed! You can still drag cards between slots or reset the game.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {slots.map((slot) => (
            <DropSlot
              key={slot.id}
              slot={slot}
              assignedCard={cards.find((card) => card.id === answers[slot.id])}
              onDrop={() => handleDrop(slot.id)}
              onClear={() => clearSlot(slot.id)}
              submitted={submitted}
              disabled={!isPlaying}
              onSpeak={speak}
            />
          ))}
        </div>

        {showResult && (
          <div className="text-sm text-center text-white/90">
            Bạn trả lời đúng {correctCount}/{slots.length} câu
          </div>
        )}

        {disabledOverlay && !showResult && (
          <div className="text-center text-white/70 text-sm">
            Nhấn Play để bắt đầu kéo thả và hệ thống sẽ đếm ngược thời gian.
          </div>
        )}
      </div>
    </section>
  );
};

type DropSlotProps = {
  slot: Slot;
  assignedCard?: Card;
  onDrop: () => void;
  onClear: () => void;
  submitted: boolean;
  disabled: boolean;
  onSpeak: (text: string) => void;
};

const DropSlot = ({
  slot,
  assignedCard,
  onDrop,
  onClear,
  submitted,
  disabled,
  onSpeak,
}: DropSlotProps) => {
  const isCorrect = assignedCard && assignedCard.id === slot.correctCardId;
  const isWrong = submitted && assignedCard && !isCorrect;

  return (
    <div
      className={`rounded-2xl border-2 border-dashed p-4 min-h-[110px] bg-white/5 flex flex-col gap-3 transition ${
        isCorrect ? "border-green-400 bg-green-400/10" : ""
      } ${isWrong ? "border-red-500 bg-red-500/10" : ""}`}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (!disabled) {
          onDrop();
        }
      }}
    >
      <p className="text-center font-semibold text-white drop-shadow">{slot.label}</p>
      <div className="flex flex-col gap-2 min-h-[90px]">
        <div
          className={`relative rounded-xl text-center py-3 px-3 text-xs md:text-sm uppercase tracking-wide transition min-h-[56px] flex items-center justify-center ${
            assignedCard ? "bg-white text-slate-900 font-semibold" : "bg-white/10 text-white/50"
          }`}
        >
          {assignedCard ? assignedCard.text : ""}
          {assignedCard && (
            <button
              type="button"
              className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-slate-900 text-white text-base shadow hover:bg-slate-800"
              onClick={() => onSpeak(assignedCard.text)}
              aria-label={`Play pronunciation for ${assignedCard.text}`}
            >
              🔊
            </button>
          )}
        </div>
        <button
          className={`text-xs underline self-center transition ${
            assignedCard ? "text-white/80 hover:text-white" : "text-transparent pointer-events-none"
          }`}
          onClick={onClear}
          disabled={!assignedCard}
        >
          Gỡ thẻ
        </button>
      </div>
    </div>
  );
};

export default VocabularyDragGame;


