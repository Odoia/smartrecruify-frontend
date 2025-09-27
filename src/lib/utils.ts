// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** Merge de classes com suporte a Tailwind (shadcn pattern) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
