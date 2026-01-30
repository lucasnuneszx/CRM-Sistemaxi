"use client"

/**
 * This project previously referenced `@radix-ui/react-alert-dialog`, but that
 * dependency is not present in the current workspace. To keep builds green,
 * we provide a lightweight compatibility layer backed by the existing `Dialog`
 * primitives already installed (`@radix-ui/react-dialog`).
 *
 * Behavior is close enough for confirmations; if you later add
 * `@radix-ui/react-alert-dialog`, you can swap back to the full implementation.
 */

import * as React from "react"
import {
  Dialog as AlertDialog,
  DialogTrigger as AlertDialogTrigger,
  DialogContent as AlertDialogContent,
  DialogHeader as AlertDialogHeader,
  DialogFooter as AlertDialogFooter,
  DialogTitle as AlertDialogTitle,
  DialogDescription as AlertDialogDescription,
} from "@/components/ui/dialog"

// No-ops / aliases for API compatibility
const AlertDialogPortal = React.Fragment
const AlertDialogOverlay = React.Fragment

// In this shim, action/cancel just render children; consumers should place buttons inside content/footer.
const AlertDialogAction = ({ children }: { children: React.ReactNode }) => <>{children}</>
const AlertDialogCancel = ({ children }: { children: React.ReactNode }) => <>{children}</>

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}

