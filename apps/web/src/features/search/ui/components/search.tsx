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
    openMobile: boolean;
    setOpenMobile: (open: boolean) => void;
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
    const [openMobile, setOpenMobile] = React.useState(false);

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
            isMobile,
            openMobile,
            setOpenMobile
        }),
        [open, setOpen, isMobile, openMobile, setOpenMobile]
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
    const { isMobile, setOpenMobile, setOpen } = useSearch();

    const effectiveVariant = variant ?? (isMobile ? 'noShadow' : 'default');

    return (
        <div className={isMobile ? '' : 'hidden'}>
            <Button
                variant={effectiveVariant}
                className={cn('size-7 px-2', className)}
                onClick={() => {
                    if (isMobile) {
                        setOpenMobile(true);
                    } else {
                        setOpen(true);
                    }
                }}
            >
                <SearchIcon />
            </Button>
        </div>
    );
};
export function SearchForm({
    className,
    collapsed,
    ...props
}: React.ComponentProps<'div'> & { collapsed: boolean }) {
    const { setOpen } = useSearch();

    return (
        <div {...props} className={cn(className)}>
            <SidebarGroup>
                <SidebarGroupContent className="relative">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                className={cn(
                                    !collapsed && 'border-2 bg-white'
                                )}
                            >
                                <div className="font-bold">
                                    <SearchIcon className="size-5" />
                                    <SidebarInput
                                        id="search"
                                        placeholder="Search runners, tokens..."
                                        className="group-data-[collapsible=icon]:hidden cursor-default bg-transaprent border-0 outline-0 pointer-events-none"
                                        onClick={() => {
                                            if (!collapsed) {
                                                setOpen(true);
                                            }
                                        }}
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

// export const Searchbar = ({
//     onOpenChange
// }: {
//     onOpenChange: (open: boolean) => void;
// }) => {
//     return (
//         <div className="hidden md:block relative w-full max-w-2xl">
//             <div className="relative">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
//                 <Input
//                     placeholder="Search runners..."
//                     className="pl-10 h-14 text-lg font-bold placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
//                     onClick={() => onOpenChange(true)}
//                     readOnly
//                 />
//             </div>
//         </div>
//     );
// };
