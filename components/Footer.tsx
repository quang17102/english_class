// components/Footer.tsx

const Footer = () => {
    return (
      <footer className="border-t mt-8">
        <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-slate-500 flex flex-wrap justify-between gap-3">
          <span>© {new Date().getFullYear()} LinguaVerse. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-blue-600">
              About
            </a>
            <a href="#" className="hover:text-blue-600">
              Terms
            </a>
            <a href="#" className="hover:text-blue-600">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    );
  };
  
  export default Footer;
  