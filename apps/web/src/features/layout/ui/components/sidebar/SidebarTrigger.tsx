import { useState } from 'react';
import { SIDEBAR_ROUTES } from '@phyt/core';
import { Menu } from 'lucide-react';
import { MobileSidebar } from './MobileSidebar';
import { Button } from '@/components/ui/button';

export const SidebarTrigger = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="md:hidden">
            <Button
                className="size-7 px-2"
                variant="ghost"
                onClick={() => setOpen(true)}
            >
                <Menu />
            </Button>
            <MobileSidebar
                items={SIDEBAR_ROUTES}
                open={open}
                onOpenChange={setOpen}
            />
        </div>
    );
};
