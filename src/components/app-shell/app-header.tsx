import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserMenu } from "./user-menu"

export function AppHeader() {
  return (
    <header className="bg-background sticky top-0 z-10 flex h-14 items-center justify-between border-b px-4">
      <SidebarTrigger />
      <UserMenu />
    </header>
  )
}
