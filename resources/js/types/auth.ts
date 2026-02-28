export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string; // legacy optional field
    avatar_url?: string; // current accessor from backend
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    roles?: Array<{ name: string }>;
    [key: string]: unknown;
};

export type Auth = {
    permissions?: string[];
    roles?: Array<{ name: string }>;
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
