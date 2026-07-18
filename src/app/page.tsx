import { redirect } from "next/navigation";

export default function Home() {
  // Redirect root path to the protected dashboard route natively
  redirect("/dashboard");
}
