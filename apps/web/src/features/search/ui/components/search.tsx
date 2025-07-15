import React from 'react';
import { Search as SearchIcon } from 'lucide-react';

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarInput,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from '@/components/ui/sidebar';

type SearchContextProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    isMobile: boolean;
};

const SearchContext = React.createContext<SearchContextProps | null>(null);

export function useSearch() {
    const context = React.useContext(SearchContext);
    if (!context) {
        throw new Error('useSearch must be used within a SearchProvider.');
    }

    return context;
}

export function SearchProvider({
    open: openProp,
    onOpenChange: setOpenProp,
    children
}: React.ComponentProps<'div'> & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const isMobile = useIsMobile();

    // This is the internal state of the search dialog.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(false);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
        (value: boolean | ((value: boolean) => boolean)) => {
            const openState = typeof value === 'function' ? value(open) : value;
            if (setOpenProp) {
                setOpenProp(openState);
            } else {
                _setOpen(openState);
            }
        },
        [setOpenProp, open]
    );

    const contextValue = React.useMemo<SearchContextProps>(
        () => ({
            open,
            setOpen,
            isMobile
        }),
        [open, setOpen, isMobile]
    );

    return (
        <SearchContext.Provider value={contextValue}>
            {children}
        </SearchContext.Provider>
    );
}

interface SearchProps {
    variant?: 'default' | 'reverse' | 'neutral' | 'noShadow' | 'ghost';
    inputClassName?: string;
    listClassName?: string;
}

export function Search({ inputClassName, listClassName }: SearchProps) {
    const { open, setOpen } = useSearch();
    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder="Search runners..."
                className={inputClassName}
            />
            <CommandList className={listClassName}>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Runners">
                    <CommandItem>
                        <SearchIcon className="mr-2 h-4 w-4" />
                        <span>Alex Storm</span>
                    </CommandItem>
                    <CommandItem>
                        <SearchIcon className="mr-2 h-4 w-4" />
                        <span>Sarah Speed</span>
                    </CommandItem>
                    <CommandItem>
                        <SearchIcon className="mr-2 h-4 w-4" />
                        <span>Mike Marathon</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}

interface SearchButtonProps {
    className?: string;
    variant?: 'default' | 'reverse' | 'neutral' | 'noShadow' | 'ghost';
}

export const SearchButton = ({ className, variant }: SearchButtonProps) => {
    const { isMobile, setOpen } = useSearch();

    const effectiveVariant = variant ?? (isMobile ? 'noShadow' : 'reverse');

    return (
        <div className="md:hidden block">
            <Button
                variant={effectiveVariant}
                className={cn('size-8', className)}
                onClick={() => {
                    setOpen(true);
                }}
            >
                <SearchIcon />
            </Button>
        </div>
    );
};
export function SidebarSearchForm({
    className,
    collapsed,
    ...props
}: React.ComponentProps<'div'> & { collapsed: boolean }) {
    const { setOpen } = useSearch();

    return (
        <div {...props} className={cn(className)}>
            <SidebarGroup className="">
                <SidebarGroupContent className="relative">
                    <SidebarMenu>
                        <SidebarMenuItem className="border-0 outline-0 ring-0 focus:border-0 focus:outline-0 focus:ring-0 focus-visible:border-0 focus-visible:outline-0 focus-visible:ring-0 active:border-0 active:outline-0 active:ring-0">
                            <SidebarMenuButton
                                asChild
                                className={cn(
                                    !collapsed &&
                                        'border-0 bg-sidebar text-sidebar-foreground rounded-none hover:border-0 hover:outline-0 hover:ring-0 focus:border-0 focus:outline-0 focus:ring-0 focus-visible:border-0 focus-visible:outline-0 focus-visible:ring-0 active:border-0 active:outline-0 active:ring-0 group/search'
                                )}
                            >
                                <div className="font-bold group-hover/search:bg-main border-0 outline-0 ring-0 focus:border-0 focus:outline-0 focus:ring-0 focus-visible:border-0 focus-visible:outline-0 focus-visible:ring-0 active:border-0 active:outline-0 active:ring-0">
                                    <SearchIcon className="size-5 group-hover/search:text-black" />
                                    <SidebarInput
                                        id="search"
                                        placeholder="Search runners, tokens..."
                                        className="group-data-[collapsible=icon]:hidden cursor-pointer bg-transparent border-0 outline-0 ring-0 focus:border-0 focus:outline-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-0 focus-visible:border-0 active:border-0 active:outline-0 active:ring-0 hover:border-0 hover:outline-0 hover:ring-0 placeholder:text-sidebar-foreground group-hover/search:placeholder:text-black group-hover/search:text-black caret-transparent"
                                        onClick={() => {
                                            if (!collapsed) {
                                                setOpen(true);
                                            }
                                        }}
                                        readOnly
                                    />
                                </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </div>
    );
}

export const Searchbar = () => {
    const { setOpen } = useSearch();

    return (
        <div className="hidden md:block relative w-4/7">
            <div className="relative group hover:translate-x-reverseBoxShadowX hover:translate-y-reverseBoxShadowY hover:shadow-shadow focus-within:translate-x-reverseBoxShadowX focus-within:translate-y-reverseBoxShadowY focus-within:shadow-shadow transition-all">
                <SearchIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground z-10" />
                <Input
                    placeholder="Search runners..."
                    className="pl-10 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none placeholder-text-foreground transition-colors hover:bg-accent-3 focus-visible:bg-accent-3 placeholder:text-black hover:!translate-x-0 hover:!translate-y-0 hover:!shadow-none focus-visible:!translate-x-0 focus-visible:!translate-y-0 focus-visible:!shadow-none"
                    onClick={() => {
                        setOpen(true);
                    }}
                    readOnly
                />
            </div>
        </div>
    );
};
