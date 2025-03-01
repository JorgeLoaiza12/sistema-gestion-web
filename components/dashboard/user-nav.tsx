// components/dashboard/user-nav.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  CreditCard,
  HelpCircle,
  LifeBuoy,
  LogOut,
  Mail,
  MessageSquare,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";

export function UserNav() {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt="Avatar" />
            <AvatarFallback>YA</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Young Alaska</p>
            <p className="text-xs leading-none text-muted-foreground">
              young@alaska.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/billing")}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Facturación</span>
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/team")}>
            <Users className="mr-2 h-4 w-4" />
            <span>Equipo</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push("/dashboard/new-project")}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Nuevo Proyecto</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/invite")}>
            <UserPlus className="mr-2 h-4 w-4" />
            <span>Invitar Usuarios</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => window.open("https://docs.example.com", "_blank")}
          >
            <LifeBuoy className="mr-2 h-4 w-4" />
            <span>Soporte</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => window.open("https://docs.example.com", "_blank")}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Documentación</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
