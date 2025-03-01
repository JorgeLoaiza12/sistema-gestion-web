import {
  LayoutDashboard,
  Users,
  MessagesSquare,
  User,
  Boxes,
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
    ],
  },
  {
    title: "Equipo",
    items: [
      {
        name: "Usuarios",
        href: "/dashboard/team",
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
