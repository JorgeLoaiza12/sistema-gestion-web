import {
  LayoutDashboard,
  Users,
  MessagesSquare,
  User,
  Boxes,
  Anvil,
} from "lucide-react";

type NavigationItem = {
  name: string;
  href: string;
  icon: any;
  description: string;
  badge?: number;
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
      },
      {
        name: "Clientes",
        href: "/dashboard/customers",
        icon: Users,
        description: "Administra tus clientes",
      },
      {
        name: "Cotizaciones",
        href: "/dashboard/quotes",
        icon: MessagesSquare,
        description: "Centro de mensajes",
      },
      {
        name: "Trabajos",
        href: "/dashboard/tasks",
        icon: Anvil,
        description: "Gestiona tus trabajos",
      },
      {
        name: "Reportes",
        href: "/dashboard/reports",
        icon: Anvil,
        description: "Gestiona tus reportes",
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
      },
    ],
  },
];
