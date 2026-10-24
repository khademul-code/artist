"use client";

import { AlertDialog, Button } from "@heroui/react";
import { ComponentProps, ReactNode } from "react";
import { Trash } from "lucide-react";

type ConfirmColor = "danger" | "primary" | "secondary" | "success" | "warning";
type DialogStatus = NonNullable<ComponentProps<typeof AlertDialog.Icon>["status"]>;
type ButtonVariant = ComponentProps<typeof Button>["variant"];

interface ConfirmDialogProps {
    title?: string;
    description?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    trigger: ReactNode;
    icon?: ReactNode;
    confirmText?: string;
    confirmColor?: ConfirmColor;
    onOpenChange?: (isOpen: boolean) => void;
}

const statusMap: Record<ConfirmColor, DialogStatus> = {
    danger: "danger",
    warning: "warning",
    success: "success",
    primary: "accent",
    secondary: "default",
};

const buttonVariantMap: Record<ConfirmColor, ButtonVariant> = {
    danger: "danger",
    primary: "primary",
    secondary: "secondary",
    success: "primary",
    warning: "primary",
};

const buttonClassMap: Partial<Record<ConfirmColor, string>> = {
    warning: "bg-amber-600 hover:bg-amber-700 text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white",
};

export function ConfirmDialog({
    title = "Delete this item?",
    description = "Are you sure you want to delete this item? This action cannot be undone.",
    onConfirm,
    onCancel,
    trigger,
    icon = <Trash className="size-5" />,
    confirmText = "Delete",
    confirmColor = "danger",
    onOpenChange,
}: ConfirmDialogProps) {
    return (
        <AlertDialog onOpenChange={onOpenChange}>
            {trigger}
            <AlertDialog.Backdrop>
                <AlertDialog.Container>
                    <AlertDialog.Dialog className="sm:max-w-[400px]">
                        <AlertDialog.CloseTrigger className="text-gray-900 dark:text-gray-100" onClick={onCancel} />
                        <AlertDialog.Header>
                            <AlertDialog.Icon status={statusMap[confirmColor]}>
                                {icon}
                            </AlertDialog.Icon>
                            <AlertDialog.Heading>{title}</AlertDialog.Heading>
                        </AlertDialog.Header>
                        <AlertDialog.Body>
                            <p className="text-gray-900 dark:text-gray-100">{description}</p>
                        </AlertDialog.Body>
                        <AlertDialog.Footer>
                            <Button slot="close" variant="tertiary" onPress={onCancel}>
                                Cancel
                            </Button>
                            <Button
                                slot="close"
                                variant={buttonVariantMap[confirmColor]}
                                className={buttonClassMap[confirmColor]}
                                onPress={onConfirm}
                            >
                                {confirmText}
                            </Button>
                        </AlertDialog.Footer>
                    </AlertDialog.Dialog>
                </AlertDialog.Container>
            </AlertDialog.Backdrop>
        </AlertDialog>
    );
}
