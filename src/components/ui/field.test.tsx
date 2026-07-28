import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Field } from "./field";
import { Input } from "./input";

describe("Field", () => {
  it("associates the label with the control", () => {
    render(
      <Field label="Display name">
        <Input defaultValue="Ben" />
      </Field>
    );

    const input = screen.getByLabelText("Display name");
    expect(input).toBeInTheDocument();
    expect(input.getAttribute("id")).toBeTruthy();
  });

  it("wires the description into aria-describedby", () => {
    render(
      <Field label="Weight" description="Logged in your preferred unit.">
        <Input />
      </Field>
    );

    const input = screen.getByLabelText("Weight");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();

    const description = screen.getByText("Logged in your preferred unit.");
    expect(describedBy!.split(" ")).toContain(description.id);
  });

  // Unhappy path: an error must reach assistive tech, not just the eye.
  it("marks the control invalid and announces the error", () => {
    render(
      <Field label="PIN" description="4 to 6 digits." error="That PIN is too short.">
        <Input />
      </Field>
    );

    const input = screen.getByLabelText("PIN");
    expect(input).toHaveAttribute("aria-invalid", "true");

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("That PIN is too short.");

    // Both description and error are announced, in that order.
    const describedBy = input.getAttribute("aria-describedby")!.split(" ");
    expect(describedBy).toContain(alert.id);
    expect(describedBy).toContain(screen.getByText("4 to 6 digits.").id);
  });

  it("leaves aria-invalid unset when there is no error", () => {
    render(
      <Field label="Notes">
        <Input />
      </Field>
    );

    expect(screen.getByLabelText("Notes")).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("respects an id the caller already put on the control", () => {
    render(
      <Field label="Reps" error="Required">
        <Input id="reps-field" />
      </Field>
    );

    const input = screen.getByLabelText("Reps");
    expect(input).toHaveAttribute("id", "reps-field");
    expect(screen.getByRole("alert")).toHaveAttribute("id", "reps-field-error");
  });

  it("marks the control required and shows the affordance", () => {
    render(
      <Field label="Sets" required>
        <Input />
      </Field>
    );

    const input = screen.getByLabelText(/Sets/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-required", "true");
  });

  // Unhappy path: a non-element child (raw text, a fragment) must not crash
  // the render, and the label must not point at an id that does not exist.
  it("renders without a dangling htmlFor when the child is not an element", () => {
    const { container } = render(<Field label="Read only">not an element</Field>);

    expect(screen.getByText("not an element")).toBeInTheDocument();
    const label = container.querySelector('[data-slot="field-label"]');
    expect(label).not.toBeNull();
    expect(label!.getAttribute("for")).toBeNull();
  });
});
