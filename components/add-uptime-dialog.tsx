"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface AddUptimeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PowerSelection {
  ejigbo: boolean
  isolo: boolean
  gen1: boolean
  gen2: boolean
  gen3: boolean
  gen4: boolean
  gen5: boolean
  gen6: boolean
  gen7: boolean
  gen8: boolean
  gen9: boolean
  gen10: boolean
  gen11: boolean
  gen12: boolean
}

export function AddUptimeDialog({ open, onOpenChange }: AddUptimeDialogProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [duration, setDuration] = useState("Unknown")
  const [testRun, setTestRun] = useState("no")
  const [powerSelection, setPowerSelection] = useState<PowerSelection>({
    ejigbo: false,
    isolo: false,
    gen1: false,
    gen2: false,
    gen3: false,
    gen4: false,
    gen5: false,
    gen6: false,
    gen7: false,
    gen8: false,
    gen9: false,
    gen10: false,
    gen11: false,
    gen12: false,
  })

  // Calculate duration whenever start time or end time changes
  useEffect(() => {
    if (!startTime || !endTime) {
      setDuration("Unknown")
      return
    }

    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    let durationMinutes = 0

    // If end time is earlier than start time, assume it's the next day
    if (endMinutes < startMinutes) {
      durationMinutes = (1440 - startMinutes) + endMinutes
    } else {
      durationMinutes = endMinutes - startMinutes
    }

    const hours = Math.floor(durationMinutes / 60)
    const minutes = durationMinutes % 60

    if (hours > 0) {
      setDuration(`${hours}h ${minutes}m`)
    } else {
      setDuration(`${minutes}m`)
    }
  }, [startTime, endTime])

  const handlePowerChange = (key: keyof PowerSelection, checked: boolean) => {
    setPowerSelection(prev => ({ ...prev, [key]: checked }))
  }

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0])
    setStartTime("")
    setEndTime("")
    setDuration("Unknown")
    setTestRun("no")
    setPowerSelection({
      ejigbo: false,
      isolo: false,
      gen1: false,
      gen2: false,
      gen3: false,
      gen4: false,
      gen5: false,
      gen6: false,
      gen7: false,
      gen8: false,
      gen9: false,
      gen10: false,
      gen11: false,
      gen12: false,
    })
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSave = async () => {
    // Validation: Check if at least one power supply is selected
    const hasSelection = Object.values(powerSelection).some(value => value)
    if (!hasSelection) {
      alert("Please select at least one Power supply before saving.")
      return
    }

    // Validation: Check if Start Time is provided
    if (!startTime) {
      alert("Please enter a Start Time before saving.")
      return
    }

    // Determine status based on End Time
    const status = endTime ? "COMPLETE" : "INCOMPLETE"

    // Create uptime records
    try {
      const selectedPowers = Object.entries(powerSelection)
        .filter(([, selected]) => selected)
        .map(([key]) => key)

      const response = await fetch('/api/uptime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          startTime,
          endTime: endTime || null,
          testRun: testRun === "yes",
          status,
          powers: selectedPowers,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save uptime')
      }

      // Success - reset form and close dialog
      alert("Uptime saved successfully!")
      resetForm()
      onOpenChange(false)

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error saving uptime:', error)
      alert("Failed to save uptime. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-gray-900">Uptime</DialogTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="date" className="text-sm text-gray-900">Date:</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Power Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-900">Power:</Label>
            <div className="space-y-3">
              {/* Row 1: Ejigbo, Isolo */}
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ejigbo"
                    checked={powerSelection.ejigbo}
                    onCheckedChange={(checked: boolean) => handlePowerChange('ejigbo', checked)}
                  />
                  <Label htmlFor="ejigbo" className="text-sm text-gray-900 cursor-pointer">
                    Ejigbo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isolo"
                    checked={powerSelection.isolo}
                    onCheckedChange={(checked: boolean) => handlePowerChange('isolo', checked)}
                  />
                  <Label htmlFor="isolo" className="text-sm text-gray-900 cursor-pointer">
                    Isolo
                  </Label>
                </div>
              </div>

              {/* Row 2: Gen 1-6 */}
              <div className="flex gap-6 flex-wrap">
                {['gen1', 'gen2', 'gen3', 'gen4', 'gen5', 'gen6'].map((gen) => (
                  <div key={gen} className="flex items-center space-x-2">
                    <Checkbox
                      id={gen}
                      checked={powerSelection[gen as keyof PowerSelection]}
                      onCheckedChange={(checked: boolean) => handlePowerChange(gen as keyof PowerSelection, checked)}
                    />
                    <Label htmlFor={gen} className="text-sm text-gray-900 cursor-pointer">
                      Gen {gen.replace('gen', '')}
                    </Label>
                  </div>
                ))}
              </div>

              {/* Row 3: Gen 7-12 */}
              <div className="flex gap-6 flex-wrap">
                {['gen7', 'gen8', 'gen9', 'gen10', 'gen11', 'gen12'].map((gen) => (
                  <div key={gen} className="flex items-center space-x-2">
                    <Checkbox
                      id={gen}
                      checked={powerSelection[gen as keyof PowerSelection]}
                      onCheckedChange={(checked: boolean) => handlePowerChange(gen as keyof PowerSelection, checked)}
                    />
                    <Label htmlFor={gen} className="text-sm text-gray-900 cursor-pointer">
                      Gen {gen.replace('gen', '')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Start Time and Duration */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-sm font-medium text-gray-900">
                Start Time:
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-40"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                Duration:
              </Label>
              <div className="text-sm text-gray-900 font-semibold py-2">
                {duration}
              </div>
            </div>
          </div>

          {/* End Time */}
          <div className="space-y-2">
            <Label htmlFor="endTime" className="text-sm font-medium text-gray-900">
              End Time:
            </Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-40"
            />
          </div>

          {/* Test Run */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">Test Run?</Label>
            <RadioGroup value={testRun} onValueChange={setTestRun} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="test-yes" />
                <Label htmlFor="test-yes" className="text-sm text-gray-900 cursor-pointer">
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="test-no" />
                <Label htmlFor="test-no" className="text-sm text-gray-900 cursor-pointer">
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
