import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PhotosPage from "@/app/photos/page";

describe("mobile photo wall image loading", () => {
  it("keeps photo thumbnails lazy-loaded with stable dimensions", async () => {
    render(<PhotosPage />);

    const previewImages = await screen.findAllByAltText(/預覽$/);

    expect(previewImages.length).toBeGreaterThan(0);

    for (const image of previewImages) {
      expect(image).toHaveAttribute("loading", "lazy");
      expect(image).toHaveAttribute("decoding", "async");
      expect(image).toHaveAttribute("width", "800");
      expect(image).toHaveAttribute("height", "600");
    }
  });
});
