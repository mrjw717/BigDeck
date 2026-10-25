import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableKeyProps {
    id: string;
    children: React.ReactNode;
    disabled?: boolean;
    isSelected?: boolean;
}

export function SortableKey({ id, children, disabled, isSelected }: SortableKeyProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isSelected ? 'ring-2 ring-primary rounded-xl' : ''}`}
        >
            {children}
        </div>
    );
}
