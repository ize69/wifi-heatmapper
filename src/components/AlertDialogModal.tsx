/*
 * wifi-heatmapper
 * File: src/components/AlertDialogModal.tsx
 * React component for the UI.
 * Generated: 2025-12-18T10:28:20.555Z
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * function AlertDialogModal — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export function AlertDialogModal({
  title,
  description,
  onConfirm,
  onCancel,
  children,
  disabled = false,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild disabled={disabled}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
