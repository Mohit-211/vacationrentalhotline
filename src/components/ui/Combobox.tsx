"use client";

import { useState } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { controlStyles } from "./Input";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

export interface ComboboxOption {
  value: string | number;
  label: string;
}

interface ComboboxProps {
  id?: string;
  options: ComboboxOption[];
  value?: string | number | null;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
}

// Same matching as the old selects: case-insensitive "label contains text".
const containsFilter = (_value: string, search: string, keywords?: string[]) =>
  (keywords ?? []).join(" ").toLowerCase().includes(search.toLowerCase()) ? 1 : 0;

/** A select with a search box, for long lists such as states and cities. */
export function Combobox({
  id,
  options,
  value,
  onChange,
  placeholder = "Select",
  searchPlaceholder = "Search",
  emptyMessage = "No matches",
  disabled,
  className,
  ...aria
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  // Like the old selects, a value with no matching option shows as-is.
  const display =
    selected?.label ?? (value !== undefined && value !== null && value !== "" ? String(value) : undefined);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            controlStyles,
            "flex h-10 items-center justify-between gap-2 py-2 text-left",
            !display && "text-muted-foreground",
            className
          )}
          {...aria}
        >
          <span className="truncate">{display ?? placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-56 p-0">
        <CommandPrimitive filter={containsFilter} className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <CommandPrimitive.Input
              placeholder={searchPlaceholder}
              className="h-10 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground md:text-sm"
            />
          </div>
          <CommandPrimitive.List className="max-h-64 overflow-x-hidden overflow-y-auto p-1">
            <CommandPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </CommandPrimitive.Empty>
            {options.map((option) => (
              <CommandPrimitive.Item
                key={option.value}
                value={String(option.value)}
                keywords={[option.label]}
                onSelect={() => {
                  onChange?.(option.value);
                  setOpen(false);
                }}
                className="relative flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none select-none data-[selected=true]:bg-surface-muted"
              >
                <Check
                  className={cn("size-4 text-primary-strong", option.value === value ? "opacity-100" : "opacity-0")}
                  aria-hidden="true"
                />
                {option.label}
              </CommandPrimitive.Item>
            ))}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  );
}
