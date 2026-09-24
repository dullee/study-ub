"use client";

interface FilterSectionProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  availableTags: string[];
  activeTags: string[];
  toggleTag: (tag: string) => void;
}

export default function FilterSection({
  searchQuery,
  setSearchQuery,
  availableTags,
  activeTags,
  toggleTag,
}: FilterSectionProps) {
  return (
    <section className="space-y-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Газрын нэр эсвэл байршлаар хайх..."
          className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-400 px-4 py-2.5 pl-10 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => {
          const isActive = activeTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </section>
  );
}
