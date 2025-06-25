import { Search } from "lucide-react";
import { useState } from "react";
import { SearchDialog } from "./SearchDialog";
import { Input } from "@/components/ui/input";

export const Searchbar = () => {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <>
            <div className="hidden md:block relative w-full max-w-2xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search runners..."
                        className="pl-10 h-14 text-lg font-bold placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                        onClick={() => setOpen(true)}
                        readOnly
                    />
                </div>
            </div>
            <SearchDialog open={open} onOpenChange={setOpen} />
        </>
    );
}; 
