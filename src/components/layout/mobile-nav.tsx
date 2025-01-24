'use client'

import * as React from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { MainNav } from './main-nav'

export function MobileNav() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" className="px-0 w-9">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="p-6">
          <h2 className="text-lg font-semibold">CrabDesk</h2>
        </div>
        <div className="px-4">
          <MainNav />
        </div>
      </SheetContent>
    </Sheet>
  )
} 