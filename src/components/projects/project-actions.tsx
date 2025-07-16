
"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
// Removed components that are no longer needed
// import { Button } from "@/components/ui/button";
// import { Pencil, Trash2 } from "lucide-react";
// import { DeleteProjectDialog } from "./delete-project-dialog";
// import { CreateProjectDialog } from "./create-project-dialog";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";

interface ProjectActionsProps {
  project: Project;
  onSuccess: () => void;
}

// This component is now empty as project management is read-only.
// It can be removed entirely from where it's called.
export function ProjectActions({ project, onSuccess }: ProjectActionsProps) {
  return null;
}
