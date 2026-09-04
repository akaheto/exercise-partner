import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/app/admin/login/actions", () => ({
  logoutAdmin: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { AdminLogoutButton } from "./admin-logout-button";

describe("AdminLogoutButton", () => {
  it("keeps the button at the 44px touch-target minimum", () => {
    render(<AdminLogoutButton />);

    // Regression test for a real gap found in the K3 accessibility review:
    // this was the admin dashboard's sole page-header action at the 36px
    // "sm" size, which VISUAL_STYLE_GUIDE.docx reserves for dense table
    // rows/toolbars only, not a standalone header action.
    expect(screen.getByRole("button", { name: /logout/i }).className).toContain("h-11");
  });
});
