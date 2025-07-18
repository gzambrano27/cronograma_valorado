
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Building, Star } from "lucide-react"

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

interface CompanySwitcherProps {
  user: SessionUser;
  onCompanyChange: (companies: Company[]) => void;
}

export function CompanySwitcher({ user, onCompanyChange }: CompanySwitcherProps) {
  const [open, setOpen] = React.useState(false)
  const allowedCompanies = user.allowedCompanies || [];
  const [selectedCompanies, setSelectedCompanies] = React.useState<Company[]>(allowedCompanies)
  const currentCompanyId = user.company?.id;

  React.useEffect(() => {
    onCompanyChange(selectedCompanies);
  }, [selectedCompanies, onCompanyChange]);

  const handleSelect = (company: Company) => {
    setSelectedCompanies(prev => {
        const isSelected = prev.some(c => c.id === company.id);
        if (isSelected) {
            // Unselect, but ensure at least one company is always selected
            if (prev.length > 1) {
                return prev.filter(c => c.id !== company.id);
            }
            return prev;
        } else {
            return [...prev, company];
        }
    })
  }
  
  const selectAll = () => setSelectedCompanies(allowedCompanies);
  const deselectAll = () => {
      // Keep at least the current company selected
      if (currentCompanyId) {
          const current = allowedCompanies.find(c => c.id === currentCompanyId);
          if (current) {
              setSelectedCompanies([current]);
          }
      }
  };


  const companyLabel = selectedCompanies.length === 1 
    ? selectedCompanies[0].name 
    : selectedCompanies.length === allowedCompanies.length
    ? "Todas las Compañías"
    : selectedCompanies.length > 1
    ? `${selectedCompanies.length} compañías`
    : "Seleccionar compañía...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Seleccionar compañía"
          className="w-[250px] justify-between"
        >
          <span className="truncate">{companyLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Buscar compañía..." />
            <CommandEmpty>No se encontró la compañía.</CommandEmpty>
            <CommandGroup heading="Compañías Permitidas">
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
                  <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{company.name}</span>
                  {company.id === currentCompanyId && (
                     <Star className="ml-auto h-4 w-4 text-yellow-400 fill-current" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <CommandSeparator />
          <div className="p-2 flex justify-between">
              <Button variant="link" size="sm" className="px-2" onClick={selectAll}>Seleccionar Todo</Button>
              <Button variant="link" size="sm" className="px-2" onClick={deselectAll}>Quitar Selección</Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
