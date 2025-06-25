import { Link } from "@tanstack/react-router";
import type { LucideProps } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface SidebarItem {
    href: string;
    children: React.ReactNode;
    icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
}

interface MobileSidebarProps {
    items: Array<SidebarItem>;
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
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center text-base font-medium"
                            onClick={() => onOpenChange(false)}
                        >
                            <item.icon className="size-5 mr-2" />
                            {item.children}
                        </Link>
                    ))}
                    {/* <div className="border-t">
                        <Link
                            onClick={() => onOpenChange(false)}
                            to="/" className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center text-base font-medium">
                            Log in
                        </Link>
                    </div> */}
                    <div className="border-t-2">

                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};
