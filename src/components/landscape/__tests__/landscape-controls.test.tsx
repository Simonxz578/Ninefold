import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CareAction, DailyCheckIn } from "../../../domain/types";
import { AttunementField } from "../AttunementField";
import { CareActionPicker } from "../CareActionPicker";
import { LivingLandscape } from "../LivingLandscape";
import { RestMode } from "../RestMode";

const CHECK_IN: DailyCheckIn = {
  energy: 3,
  clarity: 3,
  connection: "balanced",
  focus: "self",
};

describe("living-world controls", () => {
  it("maps the sky field to discrete, native form controls", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<AttunementField value={CHECK_IN} onChange={onChange} />);

    expect(container.querySelector(".attunement-field__sky")).toBeInTheDocument();
    const energyGroup = screen.getByRole("group", { name: "Energy" });
    await user.click(within(energyGroup).getByRole("radio", { name: /5 very high/i }));

    expect(onChange).toHaveBeenCalledWith({ ...CHECK_IN, energy: 5 });
  });

  it("keeps care actions as an explicit user choice", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(careAction: CareAction) => void>();
    render(<CareActionPicker value={null} onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: /open/i }));
    expect(onChange).toHaveBeenCalledWith("open");
  });

  it("offers the specified rest durations and restores focus after Escape", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Enter rest</button>
          <RestMode open={open} onClose={() => setOpen(false)}>
            <div aria-hidden="true">Landscape</div>
          </RestMode>
        </>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Enter rest" });
    await user.click(trigger);

    expect(screen.getByRole("button", { name: "30 seconds" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 minute" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open-ended" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Return" })).toHaveFocus());

    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("reads every landscape control from the Chinese dictionary", () => {
    const attunement = render(
      <AttunementField value={CHECK_IN} onChange={vi.fn()} locale="zh-CN" />,
    );
    expect(screen.getByRole("group", { name: "能量" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("什么正在占据你的一部分注意力？")).toBeInTheDocument();
    attunement.unmount();

    const care = render(
      <CareActionPicker value={null} onChange={vi.fn()} locale="zh-CN" />,
    );
    expect(screen.getByRole("group", { name: "选择一种照料方式" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /敞开/ })).toBeInTheDocument();
    care.unmount();

    const rest = render(
      <RestMode open onClose={vi.fn()} locale="zh-CN">
        <LivingLandscape path={2} locale="zh-CN" />
      </RestMode>,
    );
    expect(screen.getByRole("heading", { name: "在这片风景中停留" })).toBeInTheDocument();
    expect(screen.getByText("九境之树 · 联结")).toBeInTheDocument();
    expect(screen.getByText(/这里有 0 个生长印记/)).toBeInTheDocument();
    rest.unmount();
  });
});
