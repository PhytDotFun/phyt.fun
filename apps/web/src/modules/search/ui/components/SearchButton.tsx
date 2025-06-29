import { Search } from 'lucide-react';
import { useState } from 'react';
import { SearchDialog } from './SearchDialog';
import { Button } from '@/components/ui/button';

export const SearchButton = () => {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <div className="md:hidden">
            <Button className="size-7 px-2" onClick={() => setOpen(true)}>
                <Search />
            </Button>
            <SearchDialog open={open} onOpenChange={setOpen} />
        </div>
    );
};
