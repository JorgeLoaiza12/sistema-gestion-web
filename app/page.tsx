import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Inicio",
};

export default function Home() {
  redirect("/login");
}
