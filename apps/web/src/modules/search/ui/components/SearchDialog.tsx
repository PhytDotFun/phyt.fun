import { Search } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface SearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const SearchDialog = ({ open, onOpenChange }: SearchDialogProps) => {
    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Search runners..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Runners">
                    <CommandItem>
                        <Search className="mr-2 h-4 w-4" />
                        <span>Alex Storm</span>
                    </CommandItem>
                    <CommandItem>
                        <Search className="mr-2 h-4 w-4" />
                        <span>Sarah Speed</span>
                    </CommandItem>
                    <CommandItem>
                        <Search className="mr-2 h-4 w-4" />
                        <span>Mike Marathon</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
};
