import { Link } from "@tanstack/react-router";
import type { SidebarRoute } from "@phyt/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { getIconComponent } from "@/lib/utils";

interface MobileSidebarProps {
    items: ReadonlyArray<SidebarRoute>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const MobileSidebar = ({ items, open, onOpenChange }: MobileSidebarProps) => {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="left"
                className="p-0 border-0 border-r-2 border-t-1 transition-none top-[80px] h-[calc(100vh-80px)]"
            >
                <ScrollArea className="flex flex-col overflow-y-auto h-full pb-2">
                    {items.map((item) => {
                        const IconComponent = getIconComponent(item.iconName);
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center text-base font-medium"
                                onClick={() => onOpenChange(false)}
                            >
                                <IconComponent className="size-5 mr-2" />
                                {item.label}
                            </Link>
                        );
                    })}
                    <div className="border-t-2"></div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};
