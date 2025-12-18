/*
 * wifi-heatmapper
 * File: src/components/PopoverHelpText.tsx
 * React component for the UI.
 * Generated: 2025-12-18T10:28:20.555Z
 */

import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * const PopoverHelper = — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export const PopoverHelper = ({ text }: { text: string }) => {
  return (
    <Popover>
      <PopoverTrigger>
        <Info className="w-4 h-4 relative top-0.5" />
      </PopoverTrigger>
      <PopoverContent>{text}</PopoverContent>
    </Popover>
  );
};
