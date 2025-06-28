import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
    Activity,
    BarChart3,
    Home,
    Store,
    Trophy,
    User
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ClassValue } from "clsx";

export function cn(...inputs: Array<ClassValue>) {
    return twMerge(clsx(inputs));
}

const iconMap: Record<string, LucideIcon> = {
    Home,
    Store,
    Activity,
    Trophy,
    Leaderboard: BarChart3,
    User,
};

export function getIconComponent(iconName: string): LucideIcon {
    return iconName in iconMap ? iconMap[iconName] : Home;
}
