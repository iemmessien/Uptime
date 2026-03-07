"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface CompleteUptimeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  uptimeId: number | null
  date: string
  startTime: string
}

export function CompleteUptimeDialog({ 
  open, 
  onOpenChange, 
  uptimeId,
  date,
  startTime 
}: CompleteUptimeDialogProps) {
  const [endTime, setEndTime] = useState("")
  const [timeError, setTimeError] = useState("")

  // Validate time whenever end time changes
  useEffect(() => {
    if (!startTime || !endTime) {
      setTimeError("")
      return
    }

    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    // Check if start time is later than or equal to end time
    if (startMinutes >= endMinutes) {
      setTimeError("End Time must be after Start Time")
      return
    }

    // Valid time range - clear error
    setTimeError("")
  }, [startTime, endTime])

  const resetForm = () => {
    setEndTime("")
    setTimeError("")
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSave = async () => {
    // Validation: Check if End Time is provided
    if (!endTime) {
      alert("Please enter an End Time.")
      return
    }

    // Validation: Check if Start Time is before End Time
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    if (startMinutes >= endMinutes) {
      alert("End Time must be after Start Time. Please adjust the time.")
      return
    }

    // Update uptime record
    try {
      const response = await fetch('/uptime/api/uptime/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uptimeId,
          endTime,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update uptime')
      }

      // Success - reset form and close dialog
      alert("Uptime completed successfully!")
      resetForm()
      onOpenChange(false)

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error completing uptime:', error)
      alert("Failed to complete uptime. Please try again.")
    }
  }

  const formatDate = (dateString: string): string => {
    const d = new Date(dateString)
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTime = (timeString: string): string => {
    if (!timeString) return ""
    const date = new Date(timeString)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Complete Uptime</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">Date:</Label>
            <div className="text-sm text-gray-700">{formatDate(date)}</div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">Start Time:</Label>
            <div className="text-sm text-gray-700">{formatTime(startTime)}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime" className="text-sm font-medium text-gray-900">
              End Time: <span className="text-red-600">*</span>
            </Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={timeError ? "border-red-500" : ""}
              required
            />
            {timeError && (
              <p className="text-sm text-red-600">{timeError}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!!timeError || !endTime}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
