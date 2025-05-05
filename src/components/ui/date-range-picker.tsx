
"use client"

import * as React from "react"
import { format } from "date-fns"
import type { DateRange, SelectRangeEventHandler } from "react-day-picker"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  onDateSelect?: SelectRangeEventHandler; // Add onDateSelect prop
}

export function DateRangePicker({
  className,
  date,
  onDateChange,
  onDateSelect, // Receive onDateSelect prop
  id // Receive id prop
}: DateRangePickerProps & { id?: string }) { // Make id optional if not always needed
  const [isOpen, setIsOpen] = React.useState(false); // State to control popover

  // Handler to close popover when a range is fully selected
  const handleSelect: SelectRangeEventHandler = (range, selectedDay, activeModifiers, e) => {
      onDateChange(range); // Update the date range state via the passed callback
      if (onDateSelect) {
          onDateSelect(range, selectedDay, activeModifiers, e); // Call original onDateSelect if provided
      }
      // Close the popover only if both 'from' and 'to' dates are selected
      if (range?.from && range?.to) {
          setIsOpen(false);
      }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id} // Assign id to the trigger button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect} // Use the new handler
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
