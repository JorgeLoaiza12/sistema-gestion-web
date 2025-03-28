// config/navigation.ts
import {
  LayoutDashboard,
  Users,
  MessagesSquare,
  User,
  Boxes,
  Anvil,
  Calendar,
} from "lucide-react";

type NavigationItem = {
  name: string;
  href: string;
  icon: any;
  description: string;
  badge?: number;
  requiredRole?: string | string[]; // Propiedad para controlar el acceso
};

type Navigation = {
  title: string;
  items: NavigationItem[];
};

export const navigation: Navigation[] = [
  {
    title: "Principal",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Vista general de tu cuenta",
        requiredRole: ["ADMIN", "WORKER"],
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        name: "Productos",
        href: "/dashboard/products",
        icon: Boxes,
        description: "Gestiona tus productos",
        requiredRole: "ADMIN",
      },
      {
        name: "Clientes",
        href: "/dashboard/customers",
        icon: Users,
        description: "Administra tus clientes",
        requiredRole: "ADMIN",
      },
      {
        name: "Cotizaciones",
        href: "/dashboard/quotes",
        icon: MessagesSquare,
        description: "Centro de mensajes",
        requiredRole: "ADMIN",
      },
      {
        name: "Trabajos",
        href: "/dashboard/tasks",
        icon: Anvil,
        description: "Gestiona tus trabajos",
        requiredRole: "ADMIN",
      },
      {
        name: "Mantenimientos",
        href: "/dashboard/maintenance",
        icon: Calendar,
        description: "Gestiona los mantenimientos",
        requiredRole: "ADMIN",
      },
      {
        name: "Agenda",
        href: "/dashboard/agenda",
        icon: Calendar,
        description: "Vista de agenda para tareas",
        requiredRole: ["ADMIN", "WORKER"], // Permitir tanto a ADMIN como WORKER
      },
    ],
  },
  {
    title: "Equipo",
    items: [
      {
        name: "Usuarios",
        href: "/dashboard/users",
        icon: Users,
        description: "Gestiona tu equipo",
        requiredRole: "ADMIN",
      },
    ],
  },
  {
    title: "Cuenta",
    items: [
      {
        name: "Perfil",
        href: "/dashboard/profile",
        icon: User,
        description: "Tus datos personales",
        requiredRole: "ALL",
      },
    ],
  },
];
