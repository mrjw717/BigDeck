import React, { useState } from 'react';
import { FolderOpen, FileSearch, X } from 'lucide-react';

interface PathPickerProps {
    value: string;
    type: 'file' | 'directory';
    placeholder?: string;
    onChange: (path: string) => void;
}

export function PathPicker({ value, type, placeholder, onChange }: PathPickerProps) {
    const [isHovered, setIsHovered] = useState(false);

    const handlePick = async () => {
        try {
            let paths: string[] | undefined;
            if (type === 'file') {
                paths = await (window as any).bigdeck.dialog.openFile({
                    title: 'Select Application or File',
                    buttonLabel: 'Select',
                });
            } else {
                paths = await (window as any).bigdeck.dialog.openDirectory({
                    title: 'Select Folder',
                    buttonLabel: 'Select Folder',
                });
            }

            if (paths && paths.length > 0) {
                onChange(paths[0]);
            }
        } catch (error) {
            console.error('Failed to open dialog:', error);
        }
    };

    return (
        <div className="space-y-2">
            <div
                className="relative group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={value}
                            readOnly
                            placeholder={placeholder || `Select a ${type}...`}
                            className="w-full h-10 px-3 pr-10 bg-muted/30 border-2 border-border rounded-lg text-sm focus:border-primary/50 outline-none transition-all cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap"
                            onClick={handlePick}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors">
                            {type === 'file' ? <FileSearch size={16} /> : <FolderOpen size={16} />}
                        </div>
                    </div>
                    {value && (
                        <button
                            onClick={() => onChange('')}
                            className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-border bg-muted/30 hover:bg-destructive/10 hover:border-destructive/50 transition-colors text-muted-foreground hover:text-destructive"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>
            {value && (
                <p className="text-[10px] text-muted-foreground truncate px-1">
                    {value}
                </p>
            )}
        </div>
    );
}
