"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"

interface AddUptimeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  uptimeId?: number | null  // If provided, we're editing an existing uptime
  existingData?: {
    date: string
    startTime: string
    endTime?: string
    testRun: boolean
    powers: string[]
  } | null
  onSuccess?: () => void
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

export function AddUptimeDialog({ open, onOpenChange, uptimeId = null, existingData = null, onSuccess }: AddUptimeDialogProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [duration, setDuration] = useState("-")
  const [testRun, setTestRun] = useState("no")
  const [timeError, setTimeError] = useState("")
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

  // Load existing data when editing
  useEffect(() => {
    if (existingData && open) {
      // Format date to YYYY-MM-DD for the date input
      const dateObj = new Date(existingData.date)
      const formattedDate = dateObj.toISOString().split('T')[0]
      setDate(formattedDate)
      
      // Extract time from ISO datetime string in Africa/Lagos timezone
      const startDate = new Date(existingData.startTime)
      const startLagos = new Date(startDate.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }))
      const startTimeStr = `${startLagos.getHours().toString().padStart(2, '0')}:${startLagos.getMinutes().toString().padStart(2, '0')}`
      setStartTime(startTimeStr)
      
      if (existingData.endTime) {
        const endDate = new Date(existingData.endTime)
        const endLagos = new Date(endDate.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }))
        const endTimeStr = `${endLagos.getHours().toString().padStart(2, '0')}:${endLagos.getMinutes().toString().padStart(2, '0')}`
        setEndTime(endTimeStr)
      } else {
        setEndTime("")
      }
      
      setTestRun(existingData.testRun ? "yes" : "no")
      
      // Set power selections
      const newPowerSelection: PowerSelection = {
        ejigbo: existingData.powers.includes('ejigbo'),
        isolo: existingData.powers.includes('isolo'),
        gen1: existingData.powers.includes('gen1'),
        gen2: existingData.powers.includes('gen2'),
        gen3: existingData.powers.includes('gen3'),
        gen4: existingData.powers.includes('gen4'),
        gen5: existingData.powers.includes('gen5'),
        gen6: existingData.powers.includes('gen6'),
        gen7: existingData.powers.includes('gen7'),
        gen8: existingData.powers.includes('gen8'),
        gen9: existingData.powers.includes('gen9'),
        gen10: existingData.powers.includes('gen10'),
        gen11: existingData.powers.includes('gen11'),
        gen12: existingData.powers.includes('gen12'),
      }
      setPowerSelection(newPowerSelection)
    }
  }, [existingData, open])

  // Calculate duration whenever start time or end time changes
  useEffect(() => {
    if (!startTime || !endTime) {
      setDuration("-")
      setTimeError("")
      return
    }

    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    // Check if start time is later than or equal to end time (same day scenario)
    if (startMinutes >= endMinutes) {
      setDuration("Invalid")
      setTimeError("Start Time must be before End Time. Please adjust the times.")
      return
    }

    // Valid time range - clear error
    setTimeError("")
    
    const durationMinutes = endMinutes - startMinutes
    const hours = Math.floor(durationMinutes / 60)
    const minutes = durationMinutes % 60

    if (hours > 0) {
      setDuration(`${hours}h ${minutes}m`)
    } else {
      setDuration(`${minutes}m`)
    }
  }, [startTime, endTime])

  const handlePowerChange = (key: keyof PowerSelection, checked: boolean) => {
    // Prevent selecting grids (Ejigbo or Isolo) if Test Run is Yes
    if (checked && testRun === "yes" && (key === 'ejigbo' || key === 'isolo')) {
      toast.error("Test Run is only for generators. Please deselect the Test Run option to select grids.")
      return
    }

    // Count currently selected generators
    const generatorKeys: (keyof PowerSelection)[] = ['gen1', 'gen2', 'gen3', 'gen4', 'gen5', 'gen6', 'gen7', 'gen8', 'gen9', 'gen10', 'gen11', 'gen12']
    const currentlySelectedGens = generatorKeys.filter(gen => powerSelection[gen])

    // Prevent selecting more than 4 generators
    if (checked && generatorKeys.includes(key) && currentlySelectedGens.length >= 4) {
      toast.error("You can only select up to 4 generators at a time. Please deselect one generator first.")
      return
    }

    setPowerSelection(prev => ({ ...prev, [key]: checked }))
  }

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0])
    setStartTime("")
    setEndTime("")
    setDuration("-")
    setTestRun("no")
    setTimeError("")
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
      toast.error("Please select at least one Power supply before saving.")
      return
    }

    // Validation: Check if date is provided
    if (!date) {
      toast.error("Please select a date before saving.")
      return
    }

    // Validation: Check if Start Time is provided
    if (!startTime) {
      toast.error("Please enter a Start Time before saving.")
      return
    }

    // Validation: Check if End Time is provided and if Start Time is before End Time
    if (endTime) {
      const [startHour, startMinute] = startTime.split(':').map(Number)
      const [endHour, endMinute] = endTime.split(':').map(Number)

      const startMinutes = startHour * 60 + startMinute
      const endMinutes = endHour * 60 + endMinute

      if (startMinutes >= endMinutes) {
        toast.error("Start Time must be before End Time. Please adjust the times.")
        return
      }
    }

    // Determine status based on End Time
    const status = endTime ? "COMPLETE" : "INCOMPLETE"

    // Create or update uptime records
    try {
      const selectedPowers = Object.entries(powerSelection)
        .filter(([, selected]) => selected)
        .map(([key]) => key)

      if (uptimeId) {
        // Update existing uptime - we need to delete old records and create new ones
        // because the power selections might have changed
        const response = await fetch(`/uptime/api/uptime?id=${uptimeId}`, {
          method: 'PUT',
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
          throw new Error('Failed to update uptime')
        }

        toast.success("Uptime saved successfully!")
      } else {
        // Create new uptime
        const response = await fetch('/uptime/api/uptime', {
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

        toast.success("Uptime saved successfully!")
      }

      // Success - reset form and close dialog
      resetForm()
      onOpenChange(false)

      // Trigger refresh in parent component
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error saving uptime:', error)
      toast.error("Failed to save uptime. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-gray-900">Power Uptime</DialogTitle>
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
                {['gen1', 'gen2', 'gen3', 'gen4', 'gen5', 'gen6'].map((gen) => {
                  const generatorKeys: (keyof PowerSelection)[] = ['gen1', 'gen2', 'gen3', 'gen4', 'gen5', 'gen6', 'gen7', 'gen8', 'gen9', 'gen10', 'gen11', 'gen12']
                  const selectedGens = generatorKeys.filter(g => powerSelection[g])
                  const isDisabled = selectedGens.length >= 4 && !powerSelection[gen as keyof PowerSelection]
                  
                  return (
                    <div key={gen} className="flex items-center space-x-2">
                      <Checkbox
                        id={gen}
                        checked={powerSelection[gen as keyof PowerSelection]}
                        disabled={isDisabled}
                        onCheckedChange={(checked: boolean) => handlePowerChange(gen as keyof PowerSelection, checked)}
                      />
                      <Label htmlFor={gen} className={`text-sm text-gray-900 ${isDisabled ? 'opacity-50' : 'cursor-pointer'}`}>
                        Gen {gen.replace('gen', '')}
                      </Label>
                    </div>
                  )
                })}
              </div>

              {/* Row 3: Gen 7-12 */}
              <div className="flex gap-6 flex-wrap">
                {['gen7', 'gen8', 'gen9', 'gen10', 'gen11', 'gen12'].map((gen) => {
                  const generatorKeys: (keyof PowerSelection)[] = ['gen1', 'gen2', 'gen3', 'gen4', 'gen5', 'gen6', 'gen7', 'gen8', 'gen9', 'gen10', 'gen11', 'gen12']
                  const selectedGens = generatorKeys.filter(g => powerSelection[g])
                  const isDisabled = selectedGens.length >= 4 && !powerSelection[gen as keyof PowerSelection]
                  
                  return (
                    <div key={gen} className="flex items-center space-x-2">
                      <Checkbox
                        id={gen}
                        checked={powerSelection[gen as keyof PowerSelection]}
                        disabled={isDisabled}
                        onCheckedChange={(checked: boolean) => handlePowerChange(gen as keyof PowerSelection, checked)}
                      />
                      <Label htmlFor={gen} className={`text-sm text-gray-900 ${isDisabled ? 'opacity-50' : 'cursor-pointer'}`}>
                        Gen {gen.replace('gen', '')}
                      </Label>
                    </div>
                  )
                })}
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
                onFocus={(e) => {
                  if (!startTime) {
                    // Get current hour in Africa/Lagos timezone
                    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }))
                    let hour = now.getHours() % 12  // Convert to 12-hour format
                    if (hour === 0) hour = 12  // Handle midnight case
                    // Set to AM: if hour is 12, use 00:00, otherwise use the hour
                    const amHour = hour === 12 ? 0 : hour
                    const defaultTime = `${amHour.toString().padStart(2, '0')}:00`
                    setStartTime(defaultTime)
                  }
                }}
                className="w-40"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                Uptime duration:
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
              onFocus={(e) => {
                if (!endTime) {
                  // Get current hour in Africa/Lagos timezone
                  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }))
                  let hour = now.getHours() % 12  // Convert to 12-hour format
                  if (hour === 0) hour = 12  // Handle midnight case
                  // Set to PM: if hour is 12, use 12:59, otherwise add 12
                  const pmHour = hour === 12 ? 12 : hour + 12
                  const defaultTime = `${pmHour.toString().padStart(2, '0')}:59`
                  setEndTime(defaultTime)
                }
              }}
              className={`w-40 ${timeError ? 'border-red-500' : ''}`}
            />
            {timeError && (
              <p className="text-sm text-red-600 font-medium">{timeError}</p>
            )}
          </div>

          {/* Test Run */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">Test Run?</Label>
            <RadioGroup value={testRun} onValueChange={(value) => {
              // Check if grids are selected when switching to Yes
              if (value === "yes" && (powerSelection.ejigbo || powerSelection.isolo)) {
                toast.error("Test Run is only for generators. Please deselect Ejigbo and Isolo first.")
                return
              }
              setTestRun(value)
            }} className="flex gap-4">
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
          <Button 
            onClick={handleSave} 
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={!!timeError}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
