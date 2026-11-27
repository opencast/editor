import { chooseWorkflow } from "../workflowSelection";

const settings = {
  republishWorkflow: "republish",
  publishWorkflow: "publish",
  republishAreas: ["metadata" as const, "thumbnails" as const],
};

describe("chooseWorkflow", () => {
  it("republishes if only metadata changed", () => {
    expect(chooseWorkflow(["metadata"], false, settings)).toEqual({ workflowId: "republish", reason: "republish" });
  });

  it("republishes if only metadata and thumbnails changed", () => {
    expect(chooseWorkflow(["thumbnails", "metadata"], false, settings).workflowId).toBe("republish");
  });

  it("processes the video if anything else changed as well", () => {
    expect(chooseWorkflow(["metadata", "cutting"], false, settings)).toEqual({
      workflowId: "publish", reason: "process",
    });
    expect(chooseWorkflow(["tracks"], false, settings).workflowId).toBe("publish");
    expect(chooseWorkflow(["subtitles"], false, settings).workflowId).toBe("publish");
    expect(chooseWorkflow(["chapters", "thumbnails"], false, settings).workflowId).toBe("publish");
  });

  it("processes the video if nothing changed", () => {
    expect(chooseWorkflow([], false, settings)).toEqual({ workflowId: "publish", reason: "process" });
  });

  it("processes the video if the last workflow failed, no matter what changed", () => {
    expect(chooseWorkflow(["metadata"], true, settings)).toEqual({ workflowId: "publish", reason: "failed" });
    expect(chooseWorkflow([], true, settings).reason).toBe("failed");
  });

  it("uses the areas from the settings", () => {
    const withSubtitles = { ...settings, republishAreas: ["metadata" as const, "subtitles" as const] };
    expect(chooseWorkflow(["subtitles", "metadata"], false, withSubtitles).workflowId).toBe("republish");
    expect(chooseWorkflow(["thumbnails"], false, withSubtitles).workflowId).toBe("publish");
  });
});
