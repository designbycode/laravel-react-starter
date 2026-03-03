import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import type { Auth } from '@/types/auth';
import { Trash2, Upload, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import { toast } from 'sonner';

interface AvatarUploaderProps {
    currentAvatarUrl?: string;
    userName?: string;
    uploadUrl?: string;
    deleteUrl?: string;
    onUploadComplete?: () => void;
    onUploadError?: (error: string) => void;
    onDeleteComplete?: () => void;
}

export function AvatarUploader({
    currentAvatarUrl,
    userName,
    uploadUrl,
    deleteUrl,
    onUploadComplete,
    onUploadError,
    onDeleteComplete,
}: AvatarUploaderProps = {}) {
    const { auth } = usePage().props as { auth: Auth };
    const user = auth?.user;

    const isAdminMode = Boolean(uploadUrl || deleteUrl);

    // In admin mode, only use the provided user's avatar; never fall back to auth user.
    // In self mode, fall back to the authenticated user's avatar.
    const avatarUrl = isAdminMode
        ? currentAvatarUrl ?? undefined
        : currentAvatarUrl ?? user?.avatar_url ?? user?.avatar ?? undefined;

    const name = userName ?? user?.name ?? 'User';
    const upload_url = uploadUrl ?? ProfileController.uploadAvatar().url;
    const delete_url = deleteUrl ?? ProfileController.deleteAvatar().url;
    const [preview, setPreview] = useState<string | null>(null);
    const [serverAvatarUrl, setServerAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [cacheBuster, setCacheBuster] = useState<number>(() => Date.now());
    const getInitials = useInitials();

    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            onUploadError?.('Image size must be less than 5MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload file
        uploadFile(file);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
        },
        maxFiles: 1,
        multiple: false,
        disabled: uploading || deleting,
    });

    const uploadFile = async (file: File) => {
        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('avatar', file);

        // Use fetch to receive JSON with avatar_url for immediate UI update
        const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content;
        fetch(upload_url, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
            },
            body: formData,
            credentials: 'same-origin',
        })
            .then(async (res) => {
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data?.message || 'Failed to upload avatar');
                }
                return res.json();
            })
            .then((data: any) => {
            // Note: progress handled by dropzone UX; fetch doesn't provide percent easily
            
                setUploading(false);
                setProgress(0);
                setPreview(null);
                const nextUrl: string | null = data?.avatar_url || null;
                setServerAvatarUrl(nextUrl);
                setCacheBuster(Date.now());
                if (uploadUrl) {
                    // Admin mode: parent can optionally partial-reload the edited user
                    onUploadComplete?.();
                } else {
                    // Self mode: show success and optionally refresh auth in background
                    toast.success('Avatar updated');
                    router.reload({ only: ['auth'] });
                    onUploadComplete?.();
                }
            })
            .catch((e: any) => {
                setUploading(false);
                setProgress(0);
                setPreview(null);
                onUploadError?.(e?.message || 'Failed to upload avatar');
            });
    };

    const handleRemovePreview = () => {
        setPreview(null);
    };

    const handleDeleteAvatar = async () => {
        setDeleting(true);
        const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content;
        fetch(delete_url, {
            method: 'DELETE',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
            },
            credentials: 'same-origin',
        })
            .then(async (res) => {
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data?.message || 'Failed to delete avatar');
                }
                return res.json();
            })
            .then((data: any) => {
                setDeleting(false);
                setPreview(null);
                setServerAvatarUrl(null);
                setCacheBuster(Date.now());
                if (deleteUrl) {
                    onDeleteComplete?.();
                } else {
                    toast.success('Avatar removed');
                    router.reload({ only: ['auth'] });
                    onDeleteComplete?.();
                }
            })
            .catch((e: any) => {
                setDeleting(false);
                onUploadError?.(e?.message || 'Failed to delete avatar');
            });
    };

    const effectiveUrl = serverAvatarUrl ?? avatarUrl ?? undefined;
    const displayUrl = preview ?? (effectiveUrl ? `${effectiveUrl}${effectiveUrl.includes('?') ? '&' : '?'}v=${cacheBuster}` : undefined);
    const hasAvatar = Boolean((isAdminMode ? currentAvatarUrl : avatarUrl) && !preview);

    return (
        <div className="flex items-center gap-4">
            <div
                data-test="avatar-dropzone"
                {...getRootProps()}
                className={`relative cursor-pointer transition-opacity ${
                    uploading || deleting
                        ? 'pointer-events-none opacity-50'
                        : ''
                } ${isDragActive ? 'opacity-80' : ''}`}
            >
                <input {...getInputProps()} data-test="avatar-input" />
                <Avatar className="h-24 w-24">
                    <AvatarImage
                        src={displayUrl}
                        alt={name}
                        key={String(cacheBuster)}
                    />
                    <AvatarFallback className="text-2xl">
                        {getInitials(name)}
                    </AvatarFallback>
                </Avatar>

                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity hover:opacity-100">
                    <Upload className="h-6 w-6 text-white" />
                </div>

                {/* Upload progress overlay */}
                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                        <div className="text-center">
                            <div className="text-sm font-medium text-white">
                                {progress}%
                            </div>
                        </div>
                    </div>
                )}

                {/* Drag active overlay */}
                {isDragActive && !uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-dashed border-primary bg-primary/10">
                        <Upload className="h-6 w-6 text-primary" />
                    </div>
                )}

                {/* Remove preview button */}
                {preview && !uploading && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePreview();
                        }}
                        className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-md transition-opacity hover:opacity-80"
                        type="button"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                    {isDragActive
                        ? 'Drop to upload'
                        : 'Click or drag & drop to upload'}
                </p>
                <p className="text-xs text-muted-foreground">
                    {isAdminMode
                        ? 'PNG/JPG up to 5 MB. Changes apply to this user.'
                        : 'PNG/JPG up to 5 MB.'}
                </p>

                {hasAvatar && (
                    <Button
                        data-test="avatar-delete"
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteAvatar}
                        disabled={uploading || deleting}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deleting ? 'Deleting...' : 'Remove avatar'}
                    </Button>
                )}
            </div>
        </div>
    );
}
