import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s ",
    default: "Autenticación ",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
