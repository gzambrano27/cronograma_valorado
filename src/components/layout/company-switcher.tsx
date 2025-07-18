
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

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
  const currentCompany = user.company;

  React.useEffect(() => {
    onCompanyChange(selectedCompanies);
  }, [selectedCompanies, onCompanyChange]);

  const handleSelect = (company: Company) => {
    setSelectedCompanies(prev => {
        const isSelected = prev.some(c => c.id === company.id);
        if (isSelected) {
            return prev.filter(c => c.id !== company.id);
        } else {
            return [...prev, company];
        }
    })
  }

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
          className="w-[200px] justify-between"
        >
          <span className="truncate">{companyLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Buscar compañía..." />
            <CommandEmpty>No se encontró la compañía.</CommandEmpty>
            {currentCompany && (
                 <CommandGroup heading="Compañía Actual">
                 <CommandItem
                    key={currentCompany.id}
                    onSelect={() => handleSelect(currentCompany)}
                    className="text-sm"
                 >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCompanies.some(c => c.id === currentCompany.id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {currentCompany.name}
                </CommandItem>
            </CommandGroup>
            )}
            <CommandSeparator />
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
                  {company.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
