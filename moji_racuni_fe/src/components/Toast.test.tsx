import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Toast from "@/components/Toast";

describe("Toast", () => {
  it("prikazuje naslov, tekst i link", () => {
    render(
      <MemoryRouter>
        <Toast
          title="Uspešno"
          text="Račun je uspešno dodat."
          link={{ to: "/racuni", text: "Pogledaj račune" }}
          close={() => {}}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Uspešno")).toBeInTheDocument();
    expect(screen.getByText("Račun je uspešno dodat.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Pogledaj račune" }),
    ).toHaveAttribute("href", "/racuni");
  });

  it("bez linka ne prikazuje link i poziva close na klik", () => {
    const close = vi.fn();
    const { container } = render(
      <MemoryRouter>
        <Toast title="Uspešno" text="Prijava je poslata." close={close} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    const closeButton = container.querySelector(".close");
    expect(closeButton).not.toBeNull();
    fireEvent.click(closeButton!);
    expect(close).toHaveBeenCalledTimes(1);
  });
});
