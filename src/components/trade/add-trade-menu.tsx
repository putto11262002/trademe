import { Link } from "@tanstack/react-router"
import { ChevronDownIcon, PencilIcon, Plus, UploadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AddTradeMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add trade
          <ChevronDownIcon className="size-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem asChild>
          <Link to="/trades/from-slip">
            <UploadIcon className="size-4" />
            Upload slip
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/trades/new">
            <PencilIcon className="size-4" />
            Add manually
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
