import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadBlob } from "@/utils/downloadBlob";

describe("downloadBlob", () => {
  const createObjectURL = vi.fn(() => "blob:http://localhost/pdf");
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
  });

  it("clicks a temporary download link for the blob", () => {
    const blob = new Blob(["%PDF"], { type: "application/pdf" });
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this);
    });

    downloadBlob(blob, "Statistika.pdf");

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clicked).toHaveLength(1);
    expect(clicked[0]?.download).toBe("Statistika.pdf");
    expect(clicked[0]?.href).toBe("blob:http://localhost/pdf");
    expect(clicked[0]?.isConnected).toBe(false);
  });

  it("revokes the object URL only after a delay", () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    downloadBlob(new Blob(["x"]), "a.txt");

    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/pdf");
  });
});
