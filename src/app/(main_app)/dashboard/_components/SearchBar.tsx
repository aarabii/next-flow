import { Search } from "lucide-react";

export const SearchBar = () => {
  return (
    <div className="relative w-full sm:w-[264px]">
      <Search
        className="pointer-events-none absolute left-space-05 top-1/2 -translate-y-1/2 text-icon-tertiary w-5 h-5"
        aria-hidden="true"
      />
      <input
        placeholder="Search workflows..."
        className="h-10 w-full rounded-radius-xl border border-width-xs border-boarder-tertiary bg-surface-main-background-2 pl-[44px] pr-space-04 text-body text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-boarder-secondary"
        type="text"
      />
    </div>
  );
};
