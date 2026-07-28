"use client";

import { useRouter } from "next/navigation";
import { LogOut, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { logoutAdmin } from "@/app/admin/login/actions";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await logoutAdmin();
    router.push("/");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader className="size-4 animate-spin" />
          Logging out...
        </>
      ) : (
        <>
          <LogOut className="size-4" />
          Logout
        </>
      )}
    </Button>
  );
}
