import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export const WalletButton = () => {
    return (
        <div>
            <Button className="px-2 size-7">
                <Wallet />
            </Button>
        </div>
    );
};
