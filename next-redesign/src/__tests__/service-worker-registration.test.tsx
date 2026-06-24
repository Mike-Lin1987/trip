import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";

describe("ServiceWorkerRegistration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers /sw.js with root scope and uncached update checks", async () => {
    const register = vi.fn().mockResolvedValue({});
    vi.stubGlobal("navigator", {
      serviceWorker: {
        register,
      },
    });

    render(<ServiceWorkerRegistration />);

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
    });
  });

  it("does nothing when service workers are unavailable", () => {
    vi.stubGlobal("navigator", {});

    expect(() => render(<ServiceWorkerRegistration />)).not.toThrow();
  });
});
