import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import {
  CHECKLIST_STORAGE_KEY,
  ChecklistBoard,
} from "@/components/checklist/ChecklistBoard";
import { checklist2026 } from "@/data/checklist-2026";
import { mapRouteSegments } from "@/data/map";
import { mobileNavItems, siteNavItems } from "@/data/navigation";

describe("map and checklist pages", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps the route map out of standalone navigation", () => {
    expect(siteNavItems.map((item) => item.href)).not.toContain("/map");
    expect(mobileNavItems.map((item) => item.href)).not.toContain("/map");
  });

  it("defines senior-friendly transfer segments for the route map", () => {
    expect(mapRouteSegments).toHaveLength(5);
    expect(mapRouteSegments[0].from).toBe("關西機場");
    expect(mapRouteSegments[0].to).toBe("京都");
    expect(mapRouteSegments[0].comfort).toEqual(expect.any(String));
    expect(mapRouteSegments.at(-1)).toMatchObject({
      dayRange: "Day 8",
      from: "新大阪",
      to: "關西機場",
    });
  });

  it("persists checked checklist items in localStorage", async () => {
    const tasks = checklist2026.slice(0, 2);
    const { unmount } = render(<ChecklistBoard tasks={tasks} />);

    const firstCheckbox = screen.getByRole("checkbox", {
      name: `${tasks[0].title} 完成狀態`,
    });

    fireEvent.click(firstCheckbox);

    expect(firstCheckbox).toBeChecked();
    expect(
      JSON.parse(window.localStorage.getItem(CHECKLIST_STORAGE_KEY) ?? "[]"),
    ).toEqual([tasks[0].id]);

    unmount();
    render(<ChecklistBoard tasks={tasks} />);

    await waitFor(() => {
      expect(
        screen.getByRole("checkbox", {
          name: `${tasks[0].title} 完成狀態`,
        }),
      ).toBeChecked();
    });
  });
});
