import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const ProfileIcon = () => {
    return (
        <Avatar className="size-9">
            <AvatarImage src="" />
            <AvatarFallback>P</AvatarFallback>
        </Avatar>
    );
};
