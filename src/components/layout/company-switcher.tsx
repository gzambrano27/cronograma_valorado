
"use client"

import * as React from "react"
import { ChevronsUpDown, Building, Star } from "lucide-react"

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
import { Checkbox } from "../ui/checkbox"

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
    // Do not close the popover to allow multi-selection
    setOpen(true);
  }
  
  const selectAll = () => {
      onCompanyChange(allowedCompanies);
      setOpen(true);
  }
  const deselectAll = () => {
      // Keep at least the current company selected
      if (currentCompanyId) {
          const current = allowedCompanies.find(c => c.id === currentCompanyId);
          if (current) {
              onCompanyChange([current]);
              setOpen(true);
              return;
          }
      }
      // Fallback if current company is not in the list or doesn't exist
      if (allowedCompanies.length > 0) {
          onCompanyChange([allowedCompanies[0]]);
          setOpen(true);
      }
  };
  
  const getCompanyLabel = () => {
    if (selectedCompanies.length === 1) {
        return selectedCompanies[0].name;
    }
    if (selectedCompanies.length === allowedCompanies.length) {
        return "Todas las Compañías";
    }
    if (selectedCompanies.length > 1) {
       const names = selectedCompanies.map(c => c.name).slice(0, 2).join(', ');
       return selectedCompanies.length > 2 ? `${names}, +${selectedCompanies.length - 2}`: names;
    }
    return "Seleccionar...";
  }


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Seleccionar compañía"
          className="w-[440px] justify-between"
        >
          <Building className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{getCompanyLabel()}</span>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Buscar compañía..." />
            <CommandEmpty>No se encontró la compañía.</CommandEmpty>
            <CommandGroup>
              {allowedCompanies.map((company) => {
                const isSelected = selectedCompanies.some(c => c.id === company.id);
                return (
                    <CommandItem
                        key={company.id}
                        onSelect={() => handleSelect(company)}
                        className="text-sm flex items-center gap-2"
                    >
                         <Checkbox
                            id={`company-${company.id}`}
                            checked={isSelected}
                            aria-label={`Seleccionar ${company.name}`}
                         />
                        <label htmlFor={`company-${company.id}`} className="flex-1 truncate cursor-pointer">{company.name}</label>
                        {company.id === currentCompanyId && (
                            <Tooltip>
                               <TooltipTrigger asChild>
                                    <Star className="ml-auto h-4 w-4 text-yellow-400 fill-current" />
                               </TooltipTrigger>
                               <TooltipContent>
                                    <p>Compañía Principal</p>
                               </TooltipContent>
                           </Tooltip>
                        )}
                    </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
          {allowedCompanies.length > 1 && (
            <>
                <CommandSeparator />
                <CommandGroup>
                    <div className="flex items-center justify-between p-1">
                        <Button variant="link" size="sm" onClick={selectAll}>Seleccionar Todo</Button>
                        <Button variant="link" size="sm" onClick={deselectAll}>Limpiar</Button>
                    </div>
                </CommandGroup>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
