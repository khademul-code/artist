import React, { useCallback, useState, useEffect, useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import InputError from '@/components/input-error';

interface ImageUploadProps {
    onChange: (files: File | File[] | string | string[] | (File | string)[] | null) => void;
    value?: File | File[] | null | string | string[] | (File | string)[]; // string/string[] for existing image URLs
    multiple?: boolean;
    accept?: string;
    className?: string;
    error?: string;
    allowRemoveExisting?: boolean;
}

export default function ImageUpload({
    onChange,
    value,
    multiple = false,
    accept = 'image/*',
    className,
    error,
    allowRemoveExisting = true,
}: ImageUploadProps) {
    const [previews, setPreviews] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const displayError = error || internalError;

    // Generate previews when value changes
    useEffect(() => {
        if (!value) {
            setPreviews([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        if (typeof value === 'string') {
            if (value.startsWith('http') || value.startsWith('/')) {
                setPreviews([value]);
            } else {
                setPreviews([`/${value}`]);
            }
            return;
        }

        const files = Array.isArray(value) ? value : [value];
        const newPreviews = files.map((file) => {
            if (typeof file === 'string') {
                if (file.startsWith('http') || file.startsWith('/')) {
                    return file;
                }
                return `/${file}`;
            }
            return URL.createObjectURL(file as File);
        });
        setPreviews(newPreviews);

        // Cleanup URLs (only for File objects, not strings)
        return () => {
            newPreviews.forEach((url, idx) => {
                if (typeof files[idx] !== 'string') {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, [value]);

    const handleFiles = (selectedFiles: FileList | File[]) => {
        setInternalError(null);
        const filesArray = Array.from(selectedFiles);

        // Validate types
        const invalidType = filesArray.find(f => !f.type.startsWith('image/'));
        if (invalidType) {
            setInternalError('Please upload only image files.');
            return;
        }

        if (multiple) {
            const currentFiles = Array.isArray(value) ? value : [];
            const newFiles = [...currentFiles, ...filesArray];
            onChange(newFiles);
        } else {
            onChange(filesArray[0]);
        }
    };

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    }, [multiple, value]);

    const removeFile = (e: React.MouseEvent, indexToRemove: number) => {
        e.preventDefault();
        e.stopPropagation();
        setInternalError(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        if (!multiple) {
            setPreviews([]);
            onChange(null);
            return;
        }

        const currentFiles = Array.isArray(value) ? value : [];
        const newFiles = currentFiles.filter((_, index) => index !== indexToRemove);
        onChange(newFiles.length > 0 ? newFiles : null);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={cn("w-full transition-all", !multiple ? "max-w-xs" : "w-full", className)}>
            <div
                className={cn(
                    "relative border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors overflow-visible",
                    !multiple ? "h-[120px] p-2" : "min-h-[140px] p-3",
                    displayError
                        ? "border-destructive ring-1 ring-destructive/40 bg-destructive/5"
                        : isDragging
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-muted/40",
                    previews.length === 0 ? "cursor-pointer" : "cursor-default"
                )}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => {
                    if (previews.length === 0) {
                        triggerFileInput();
                    }
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    className="hidden"
                />

                {previews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center space-y-1.5 py-2 text-center pointer-events-none">
                        <UploadCloud className={cn("w-7 h-7", displayError ? "text-destructive" : "text-muted-foreground")} />
                        <p className="text-xs text-muted-foreground">
                            <span className={cn("font-semibold", displayError ? "text-destructive" : "text-primary")}>Click to upload</span> or drag and drop
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            PNG, JPG, WEBP, SVG (Max 10MB)
                        </p>
                    </div>
                ) : (
                    <div className={cn("flex items-center justify-center gap-3 w-full h-full", multiple ? "flex-wrap" : "")}>
                        {previews.map((preview, index) => {
                            const isExistingImage = typeof value === 'string' || (Array.isArray(value) && typeof value[index] === 'string');
                            const canRemove = allowRemoveExisting || !isExistingImage;

                            return (
                                <div
                                    key={index}
                                    className="relative rounded-md border border-border bg-white dark:bg-gray-900 p-1 shadow-xs flex items-center justify-center shrink-0 w-24 h-24 max-h-[96px] max-w-[96px]"
                                >
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="object-contain w-full h-full rounded"
                                    />
                                    {canRemove && (
                                        <button
                                            type="button"
                                            onClick={(e) => removeFile(e, index)}
                                            className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full hover:bg-destructive/90 transition-transform hover:scale-110 shadow-sm z-30"
                                            title="Delete image"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        {/* Replace image button for single mode */}
                        {!multiple && (
                            <div className="flex flex-col items-center justify-center">
                                <button
                                    type="button"
                                    onClick={triggerFileInput}
                                    className="text-xs text-primary hover:underline font-medium px-2 py-1 rounded bg-muted/60 hover:bg-muted"
                                >
                                    Change image
                                </button>
                            </div>
                        )}

                        {multiple && (
                            <button
                                type="button"
                                onClick={triggerFileInput}
                                className="flex flex-col items-center justify-center space-y-1 p-2 border-2 border-dashed border-border rounded-md hover:border-primary/50 hover:bg-muted/50 w-24 h-24 text-muted-foreground hover:text-primary transition-colors shrink-0"
                            >
                                <UploadCloud className="w-5 h-5" />
                                <span className="text-[10px]">Add more</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {displayError && (
                <InputError message={displayError} className="mt-1.5" />
            )}
        </div>
    );
}
