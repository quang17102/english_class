export default function Navbar() {
  return (
    <nav className="w-full py-3 px-3 sm:px-5 border-b border-[var(--card-border)] bg-[rgba(255,255,255,0.02)] backdrop-blur-sm">
      <div className="max-w-[900px] lg:max-w-[1400px] xl:max-w-[1600px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[6px] bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center">
            <span className="text-white text-[12px] font-bold">T</span>
          </div>
          <span className="text-[var(--text)] text-[12px] font-semibold">TrackShopee</span>
        </div>
        <div className="text-[var(--text3)] text-[10px]">
          Tra cứu đơn hàng
        </div>
      </div>
    </nav>
  );
}


