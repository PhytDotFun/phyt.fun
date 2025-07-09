import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    type?: 'header' | 'login';
    hasDotFun?: boolean;
}

export const Logo = ({ className, type, hasDotFun }: LogoProps) => {
    const defaultUrl =
        'https://rsg5uys7zq.ufs.sh/f/AMgtrA9DGKkFCr2hRMJrJ6ohsvQUI1liN8BxWu0wqFTVAjcO';

    const dotFunUrl =
        'https://rsg5uys7zq.ufs.sh/f/AMgtrA9DGKkFfcbkzXzul2HmTFIo5PR3pxMSVjZOqJLeuYrn';

    return (
        <img
            src={hasDotFun === true ? dotFunUrl : defaultUrl}
            alt="Phyt"
            className={cn(
                type === 'header' && 'w-30 min-w-30',
                type === 'login' && 'w-60 min-w-40',
                className
            )}
        />
    );
};
