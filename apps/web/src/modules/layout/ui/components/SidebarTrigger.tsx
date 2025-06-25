import { Home, Menu, Store, TrendingUp, Trophy, User } from "lucide-react";
import { useState } from "react";
import { MobileSidebar } from "./MobileSidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
    { href: "/", children: "Home", icon: Home },
    { href: "/market", children: "Market", icon: Store },
    { href: "/competition", children: "Competition", icon: Trophy },
    { href: "/profile", children: "Profile", icon: User },
    { href: "/activity", children: "Activity", icon: TrendingUp },
];

export const SidebarTrigger = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="md:hidden">
            <Button className="size-7 px-2" variant="ghost" onClick={() => setOpen(true)}>
                <Menu />
            </Button>
            <MobileSidebar items={menuItems} open={open} onOpenChange={setOpen} />
        </div >
    );
};
