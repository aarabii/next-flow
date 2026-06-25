import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <div className="relative w-full sm:w-66">
      <Search
        className="pointer-events-none absolute left-space-05 top-1/2 -translate-y-1/2 text-icon-tertiary w-5 h-5"
        aria-hidden="true"
      />
      <input
        placeholder="Search workflows..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-radius-xl border border-width-xs border-boarder-tertiary bg-surface-main-background-2 pl-11 pr-space-04 text-body text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-boarder-secondary"
        type="text"
      />
    </div>
  );
};

