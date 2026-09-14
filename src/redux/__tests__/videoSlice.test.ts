import reducer, { initialState, setIsPlaying, selectIsPlaying, setCurrentlyAt,
  selectCurrentlyAt, selectActiveSegmentIndex, selectPreviewTriggered,
  selectDuration, video, cut, selectSegments, markAsDeletedOrAlive, mergeRight,
  fetchVideoInformation, selectTitle,
  selectTracks, selectWorkflows, selectTrackURLs } from "../videoSlice";
import cloneDeep from "lodash/cloneDeep";
import { httpRequestState } from "../../types";


describe("Video reducer", () => {

  let initState: (video & httpRequestState);

  beforeEach(() => {
    initState = cloneDeep(initialState);
  });

  it("should return the initial state on first run", () => {
    // Arrange
    const nextState = initialState;

    // Act
    const result = reducer(undefined, { type: "" });

    // Assert
    expect(result).toEqual(nextState);
  });

  it("should set isPlaying", () => {
    // Arrange
    const isPlaying = true;

    // Act
    const nextState = reducer(initState, setIsPlaying(isPlaying));

    // Assert
    const rootState = { videoState: nextState };
    expect(selectIsPlaying(rootState)).toEqual(true);
  });

  it("should set currentlyAt", () => {
    // Arrange
    const currentlyAt = 0;

    // Act
    const nextState = reducer(initState, setCurrentlyAt(currentlyAt));

    // Assert
    const rootState = { videoState: nextState };
    expect(selectCurrentlyAt(rootState)).toEqual(0);
    expect(selectActiveSegmentIndex(rootState)).toEqual(0);
    expect(selectPreviewTriggered(rootState)).toEqual(false);
  });

  it("only allow whole numbers for currentlyAt", () => {
    // Arrange
    const currentlyAt = 123.456;

    // Act
    const nextState = reducer(initState, setCurrentlyAt(currentlyAt));

    // Assert
    const rootState = { videoState: nextState };
    expect(selectCurrentlyAt(rootState)).toEqual(123);
    expect(selectActiveSegmentIndex(rootState)).toEqual(0);
    expect(selectPreviewTriggered(rootState)).toEqual(false);
  });

  it("should not set currentlyAt to negative", () => {
    // Arrange
    const currentlyAt = -42;

    // Act
    const nextState = reducer(initState, setCurrentlyAt(currentlyAt));

    // Assert
    const rootState = { videoState: nextState };
    expect(selectCurrentlyAt(rootState)).toEqual(0);
    expect(selectActiveSegmentIndex(rootState)).toEqual(0);
    expect(selectPreviewTriggered(rootState)).toEqual(false);
  });

  it("should not set currentlyAt larger than duration", () => {
    // Arrange
    const currentlyAt = 43;
    initState.duration = 42;

    // Act
    const nextState = reducer(initState, setCurrentlyAt(currentlyAt));

    // Assert
    const rootState = { videoState: nextState };
    expect(selectCurrentlyAt(rootState)).toEqual(42);
    expect(selectActiveSegmentIndex(rootState)).toEqual(0);
    expect(selectPreviewTriggered(rootState)).toEqual(false);
  });

  it("should change the activeSegment when setting currentlyAt", () => {
    // Arrange
    const currentlyAt = 15;
    initState.duration = 30;
    initState.segments = [
      { id: "0", start: 0, end: 10, deleted: false },
      { id: "0", start: 10, end: 20, deleted: false },
      { id: "0", start: 20, end: 30, deleted: false },
    ];

    // Act
    const nextState = reducer(initState, setCurrentlyAt(currentlyAt));

    // Assert
    const rootState = { videoState: nextState };
    expect(selectCurrentlyAt(rootState)).toEqual(15);
    expect(selectActiveSegmentIndex(rootState)).toEqual(1);
    expect(selectPreviewTriggered(rootState)).toEqual(false);
  });

  it(`should set currentlyAt to end of segment when preview is active, the video
      is playing and segment is deleted`, () => {
    // Arrange
    const currentlyAt = 15;
    initState.duration = 30;
    initState.segments = [
      { id: "0", start: 0, end: 10, deleted: false },
      { id: "0", start: 10, end: 20, deleted: true },
      { id: "0", start: 20, end: 30, deleted: false },
    ];
    initState.isPlaying = true;
    initState.isPlayPreview = true;

    // Act
    const nextState = reducer(initState, setCurrentlyAt(currentlyAt));

    // Assert
    const rootState = { videoState: nextState };
    expect(selectCurrentlyAt(rootState)).toEqual(21);
    expect(selectActiveSegmentIndex(rootState)).toEqual(2);
    expect(selectPreviewTriggered(rootState)).toEqual(true);
  });

  it("should cut a segment in two", () => {
    // Arrange
    initState.currentlyAt = 5;
    initState.duration = 10;
    initState.segments = [
      { id: "0", start: 0, end: 10, deleted: false },
    ];
    const resultSegments = [
      { start: 0, end: 5, deleted: false },
      { start: 5, end: 10, deleted: false },
    ];

    // Act
    const nextState = reducer(initState, cut());

    // Assert
    const rootState = { videoState: nextState };
    expect(selectSegments(rootState)).toMatchObject(resultSegments);
  });

  it("should not cut a segment when exactly at the start", () => {
    // Arrange
    initState.currentlyAt = 0;
    initState.duration = 10;
    initState.segments = [
      { id: "0", start: 0, end: 10, deleted: false },
    ];
    const resultSegments = [
      { start: 0, end: 10, deleted: false },
    ];

    // Act
    const nextState = reducer(initState, cut());

    // Assert
    const rootState = { videoState: nextState };
    expect(selectSegments(rootState)).toMatchObject(resultSegments);
  });

  it("should not cut a segment when exactly at the end", () => {
    // Arrange
    initState.currentlyAt = 10;
    initState.duration = 10;
    initState.segments = [
      { id: "0", start: 0, end: 10, deleted: false },
    ];
    const resultSegments = [
      { start: 0, end: 10, deleted: false },
    ];

    // Act
    const nextState = reducer(initState, cut());

    // Assert
    const rootState = { videoState: nextState };
    expect(selectSegments(rootState)).toMatchObject(resultSegments);
  });

  it("should not cut a segment when exactly at the border", () => {
    // Arrange
    initState.currentlyAt = 5;
    initState.duration = 10;
    initState.segments = [
      { id: "0", start: 0, end: 5, deleted: false },
      { id: "0", start: 5, end: 10, deleted: false },
    ];
    const resultSegments = [
      { start: 0, end: 5, deleted: false },
      { start: 5, end: 10, deleted: false },
    ];

    // Act
    const nextState = reducer(initState, cut());

    // Assert
    const rootState = { videoState: nextState };
    expect(selectSegments(rootState)).toMatchObject(resultSegments);
  });

  it("should mark a segment as deleted if alive", () => {
    const resultSegments = [
      { deleted: true },
    ];

    // Act
    const nextState = reducer(initState, markAsDeletedOrAlive());

    // Assert
    const rootState = { videoState: nextState };
    expect(selectSegments(rootState)).toMatchObject(resultSegments);
  });

  it("should merge segments if possible", () => {
    initState.segments = [
      { id: "0", start: 0, end: 5, deleted: false },
      { id: "0", start: 5, end: 10, deleted: false },
    ];
    const resultSegments = [
      { start: 0, end: 10, deleted: false },
    ];

    // Act
    const nextState = reducer(initState, mergeRight());

    // Assert
    const rootState = { videoState: nextState };
    expect(selectSegments(rootState)).toMatchObject(resultSegments);
  });

  it("should not merge segments if not possible", () => {
    initState.activeSegmentIndex = 1;
    initState.segments = [
      { id: "0", start: 0, end: 5, deleted: false },
      { id: "0", start: 5, end: 10, deleted: false },
    ];
    const resultSegments = [
      { id: "0", start: 0, end: 5, deleted: false },
      { id: "0", start: 5, end: 10, deleted: false },
    ];

    // Act
    const nextState = reducer(initState, mergeRight());

    // Assert
    const rootState = { videoState: nextState };
    expect(selectSegments(rootState)).toMatchObject(resultSegments);
  });

  it("should keep state of active segment when merging", () => {
    initState.segments = [
      { id: "0", start: 0, end: 5, deleted: true },
      { id: "0", start: 5, end: 10, deleted: false },
    ];
    const resultSegments = [
      { start: 0, end: 10, deleted: true },
    ];

    // Act
    const nextState = reducer(initState, mergeRight());

    // Assert
    const rootState = { videoState: nextState };
    expect(selectSegments(rootState)).toMatchObject(resultSegments);
  });

  it("should set loading when fetch is pending", () => {
    // Arrange
    const action = { type: fetchVideoInformation.pending.type };
    const resultStatus: httpRequestState = { status: "loading", error: undefined, errorReason: "unknown" };

    // Act
    const nextState = reducer(initialState, action);

    // Assert
    const rootState = { videoState: nextState };
    expect(rootState.videoState).toMatchObject(resultStatus);
  });

  it("should set success when fetch is successful", () => {
    // Arrange
    const resultStatus: httpRequestState = { status: "success", error: undefined, errorReason: "unknown" };
    const segments = [{ start: 0, end: 42, deleted: false }];
    const trackURLs: video["trackURLs"] = ["video/url"];
    const dur: video["duration"] = 42;
    const title: video["title"] = "Video Title";
    // const presenters: video["presenters"] = [ "Otto Opencast" ]    // Currently missing from the API
    const tracks: video["tracks"] = [{
      id: "id", uri: trackURLs[0], flavor: { subtype: "prepared", type: "presenter" },
      /* eslint-disable camelcase */
      video_stream: { available: true, enabled: true, thumbnail_uri: "thumb/url" },
      audio_stream: { available: true, enabled: true, thumbnail_uri: "thumb/url" },
      /* eslint-enable camelcase */
      thumbnailUri: undefined,
      thumbnailPriority: 0,
    }];
    const workflows: video["workflows"] = [{ id: "id", name: "Name", displayOrder: 0, description: "Description" }];
    const action = {
      type: fetchVideoInformation.fulfilled.type,
      payload: {
        duration: dur,
        title: title,
        workflows: workflows,
        tracks: tracks,
        segments: segments,
      },
    };

    // Act
    const nextState = reducer(initialState, action);

    // Assert
    const rootState = { videoState: nextState };
    expect(rootState.videoState).toMatchObject(resultStatus);

    expect(selectSegments(rootState)).toMatchObject(segments);
    expect(selectTrackURLs(rootState)).toMatchObject(trackURLs);
    expect(selectDuration(rootState)).toEqual(dur);
    expect(selectTitle(rootState)).toEqual(title);
    expect(selectTracks(rootState)).toMatchObject(tracks);
    expect(selectWorkflows(rootState)).toMatchObject(workflows);
  });

  it("should set error when fetch is failed", () => {
    // Arrange
    const error = { message: "An error message" };
    const action = { type: fetchVideoInformation.rejected.type, error: error };
    const resultStatus: httpRequestState = { status: "failed", error: error.message, errorReason: "unknown" };

    // Act
    const nextState = reducer(initialState, action);

    // Assert
    const rootState = { videoState: nextState };
    expect(rootState.videoState).toMatchObject(resultStatus);
  });

  // TODO: Figure out how to properly mock the API and the redux store to test requests
});
