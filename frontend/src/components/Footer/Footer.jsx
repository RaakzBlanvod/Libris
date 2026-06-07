export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-500 text-sm py-6 mt-auto border-t border-slate-900">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>© {new Date().getFullYear()} Libris Project. Все права защищены.</div>
        <div className="flex gap-4">
          <span className="hover:text-slate-300 cursor-pointer transition">Условия использования</span>
          <span className="hover:text-slate-300 cursor-pointer transition">API Docs</span>
        </div>
      </div>
    </footer>
  );
}