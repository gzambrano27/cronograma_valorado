
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Building, Star, CheckCheck, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Company, SessionUser } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

interface CompanySwitcherProps {
  user: SessionUser;
  selectedCompanies: Company[];
  onCompanyChange: (companies: Company[]) => void;
}

export function CompanySwitcher({ user, selectedCompanies, onCompanyChange }: CompanySwitcherProps) {
  const [open, setOpen] = React.useState(false)
  const allowedCompanies = user.allowedCompanies || [];
  const currentCompanyId = user.company?.id;

  const handleSelect = (company: Company) => {
    onCompanyChange(prev => {
        const isSelected = prev.some(c => c.id === company.id);
        if (isSelected) {
            // Unselect, but ensure at least one company is always selected
            if (prev.length > 1) {
                return prev.filter(c => c.id !== company.id);
            }
            return prev; // Don't unselect if it's the last one
        } else {
            return [...prev, company];
        }
    })
  }
  
  const selectAll = () => onCompanyChange(allowedCompanies);
  const deselectAll = () => {
      // Keep at least the current company selected
      if (currentCompanyId) {
          const current = allowedCompanies.find(c => c.id === currentCompanyId);
          if (current) {
              onCompanyChange([current]);
              return;
          }
      }
      // Fallback if current company is not in the list or doesn't exist
      if (allowedCompanies.length > 0) {
          onCompanyChange([allowedCompanies[0]]);
      }
  };


  const companyLabel = selectedCompanies.length === 1 
    ? selectedCompanies[0].name 
    : selectedCompanies.length === allowedCompanies.length
    ? "Todas las Compañías"
    : selectedCompanies.length > 1
    ? `${selectedCompanies.length} compañías`
    : "Seleccionar...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Seleccionar compañía"
          className="w-[240px] justify-between"
        >
          <Building className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{companyLabel}</span>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Buscar compañía..." />
            <CommandEmpty>No se encontró la compañía.</CommandEmpty>
            <CommandGroup>
              {allowedCompanies.map((company) => (
                <CommandItem
                  key={company.id}
                  onSelect={() => handleSelect(company)}
                  className="text-sm"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCompanies.some(c => c.id === company.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <span className="flex-1 truncate">{company.name}</span>
                  {company.id === currentCompanyId && (
                     <Star className="ml-auto h-4 w-4 text-yellow-400 fill-current" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <CommandSeparator />
          <CommandList>
              <CommandGroup>
                 <div className="grid grid-cols-2 gap-1 p-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <CommandItem onSelect={selectAll} className="justify-center">
                            <CheckCheck className="h-4 w-4" />
                         </CommandItem>
                      </TooltipTrigger>
                       <TooltipContent>
                          <p>Seleccionar Todo</p>
                       </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                       <TooltipTrigger asChild>
                          <CommandItem onSelect={deselectAll} className="justify-center">
                              <X className="h-4 w-4" />
                          </CommandItem>
                       </TooltipTrigger>
                       <TooltipContent>
                          <p>Quitar Selección</p>
                       </TooltipContent>
                    </Tooltip>
                 </div>
              </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
