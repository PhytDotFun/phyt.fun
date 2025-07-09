interface ProfileLayoutProps {
    children: React.ReactNode;
}

export const ProfileLayout = ({ children }: ProfileLayoutProps) => {
    return (
        <>
            <div className="relative z-10 min-h-screen">{children}</div>
        </>
    );
};
