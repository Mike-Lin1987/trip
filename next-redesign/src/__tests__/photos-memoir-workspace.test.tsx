import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PhotosPage from "@/app/photos/page";

describe("photo memoir workspace", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows a memoir material workspace with editable layout priority and export actions", async () => {
    const createObjectUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:download");
    const revokeObjectUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    render(<PhotosPage />);

    fireEvent.click(screen.getByRole("tab", { name: "回憶錄素材" }));

    expect(await screen.findByRole("heading", { name: "回憶錄素材工作台" })).toBeInTheDocument();
    expect(screen.getByText("已選照片")).toBeInTheDocument();
    expect(screen.getByText("封面候選")).toBeInTheDocument();
    expect(screen.getByText("每日回憶草稿")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "匯出 memoir.json" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "匯出 memoir.md" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "匯出 photos-index.csv" })).toBeInTheDocument();

    const prioritySelect = screen.getAllByLabelText("回憶錄版面優先度")[0];
    fireEvent.change(prioritySelect, { target: { value: "small" } });

    expect(prioritySelect).toHaveValue("small");

    fireEvent.click(screen.getByRole("button", { name: "匯出 memoir.md" }));

    expect(createObjectUrl).toHaveBeenCalled();
    expect(anchorClick).toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:download");
  });
});
