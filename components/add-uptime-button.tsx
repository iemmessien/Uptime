"use client"

import { useState } from "react"
import { AddUptimeDialog } from "./add-uptime-dialog"

export function AddUptimeButton() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
      >
        Add Uptime
      </button>
      <AddUptimeDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
