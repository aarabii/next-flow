import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <div className="relative w-full sm:w-66">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4"
        aria-hidden="true"
      />
      <Input
        placeholder="Search workflows..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-4 text-xs h-10 rounded-xl"
        type="text"
      />
    </div>
  );
};
