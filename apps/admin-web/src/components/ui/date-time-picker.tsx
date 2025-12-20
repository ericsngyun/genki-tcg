import * as React from "react"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface DateTimePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date and time",
  disabled = false,
  className,
  error = false,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)
  const [time, setTime] = React.useState<string>(
    value ? format(value, "HH:mm") : "12:00"
  )

  React.useEffect(() => {
    if (value) {
      setSelectedDate(value)
      setTime(format(value, "HH:mm"))
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = time.split(":").map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours, minutes, 0, 0)
      setSelectedDate(newDate)
      onChange?.(newDate)
    } else {
      setSelectedDate(undefined)
      onChange?.(undefined)
    }
  }

  const handleTimeChange = (newTime: string) => {
    setTime(newTime)
    if (selectedDate) {
      const [hours, minutes] = newTime.split(":").map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours, minutes, 0, 0)
      setSelectedDate(newDate)
      onChange?.(newDate)
    }
  }

  const displayValue = selectedDate
    ? `${format(selectedDate, "PPP")} at ${time}`
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            error && "border-destructive",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
          />
        </div>
        <div className="border-t border-border px-4 py-3 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="time" className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Select Time
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setSelectedDate(undefined)
                setTime("12:00")
                onChange?.(undefined)
                setOpen(false)
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={!selectedDate}
            >
              Confirm
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
