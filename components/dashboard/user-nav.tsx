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
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function UserNav() {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full border-2 border-white/30 hover:border-white/60"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt="Avatar" />
            <AvatarFallback className="bg-primary-foreground text-primary font-bold">
              YA
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Young Alaska</p>
            <p className="text-xs leading-none text-content-subtle">
              young@alaska.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push("/dashboard/profile")}
            className="hover:bg-accent hover:text-primary cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push("/dashboard/billing")}
            className="hover:bg-accent hover:text-primary cursor-pointer"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Facturación</span>
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push("/dashboard/settings")}
            className="hover:bg-accent hover:text-primary cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push("/dashboard/team")}
            className="hover:bg-accent hover:text-primary cursor-pointer"
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Equipo</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push("/dashboard/new-project")}
            className="hover:bg-accent hover:text-primary cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Nuevo Proyecto</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push("/dashboard/invite")}
            className="hover:bg-accent hover:text-primary cursor-pointer"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            <span>Invitar Usuarios</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => window.open("https://docs.example.com", "_blank")}
            className="hover:bg-accent hover:text-primary cursor-pointer"
          >
            <LifeBuoy className="mr-2 h-4 w-4" />
            <span>Soporte</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => window.open("https://docs.example.com", "_blank")}
            className="hover:bg-accent hover:text-primary cursor-pointer"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Documentación</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-error hover:text-error focus:text-error hover:bg-error/10 cursor-pointer"
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

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-content-subtle",
        className
      )}
      {...props}
    />
  );
};
