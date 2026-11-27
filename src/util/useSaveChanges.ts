import { useTranslation } from "react-i18next";

import { useAppDispatch, useAppSelector } from "../redux/store";
import {
  selectCustomizedTrackSelection,
  selectUnsavedAreas as selectUnsavedVideoAreas,
  selectSegments,
  selectTracks,
  setHasChanges as videoSetHasChanges,
} from "../redux/videoSlice";
import { postVideoInformation, setPostRequestError } from "../redux/workflowPostSlice";
import {
  selectAllCatalogs,
  selectHasChanges as metadataSelectHasChanges,
  setHasChanges as metadataSetHasChanges,
} from "../redux/metadataSlice";
import {
  selectSubtitles,
  selectHasChanges as subtitleSelectHasChanges,
  setHasChanges as subtitleSetHasChanges,
} from "../redux/subtitleSlice";
import {
  selectSubtitles as selectChapters,
  selectHasChanges as chapterSelectHasChanges,
  setHasChanges as chapterSetHasChanges,
} from "../redux/chapterSlice";
import { setEnd } from "../redux/endSlice";
import { addChangedAreas, clearChangedAreas, selectChangedAreas } from "../redux/workflowSelectionSlice";
import { serializeSubtitle } from "./utilityFunctions";
import { Area, AREAS, Segment, SubtitlesInEditor } from "../types";

const prepareSubtitles = (subs: { [identifier: string]: SubtitlesInEditor; }) =>
  Object.entries(subs).map(([id, { deleted, cues, tags }]) => ({
    id,
    subtitle: deleted ? "" : serializeSubtitle(cues),
    tags: deleted ? [] : tags,
    deleted,
  }));

const validateSegmentLength = (segments: Segment[]) => {
  return segments.some(segment => !segment.deleted && (segment.end - segment.start > 2000));
};

/**
 * The areas in which the user changed something since the last save
 */
export const useUnsavedAreas = (): Area[] => {
  const video = useAppSelector(selectUnsavedVideoAreas);
  const metadata = useAppSelector(metadataSelectHasChanges);
  const subtitles = useAppSelector(subtitleSelectHasChanges);
  const chapters = useAppSelector(chapterSelectHasChanges);
  const changed: Record<Area, boolean> = { ...video, metadata, subtitles, chapters };
  return AREAS.filter(area => changed[area]);
};

/**
 * Whether the user changed anything since the last save
 */
export const useHasUnsavedChanges = () => useUnsavedAreas().length > 0;

/**
 * The areas in which the user changed something since the video was last published, saved or not
 */
export const useChangedAreas = (): Area[] => {
  const sinceLastPublish = useAppSelector(selectChangedAreas);
  const unsaved = useUnsavedAreas();
  return AREAS.filter(area => sinceLastPublish.includes(area) || unsaved.includes(area));
};

/**
 * Returns a function that sends the current changes to Opencast.
 * If a workflow id is given, that workflow is started and the editor ends.
 */
export const useSaveChanges = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const segments = useAppSelector(selectSegments);
  const tracks = useAppSelector(selectTracks);
  const customizedTrackSelection = useAppSelector(selectCustomizedTrackSelection);
  const subtitles = useAppSelector(selectSubtitles);
  const chapters = useAppSelector(selectChapters);
  const metadata = useAppSelector(selectAllCatalogs);
  const unsavedAreas = useUnsavedAreas();
  const changedAreas = useChangedAreas();

  // Marks the given areas as having unsaved changes, or not
  const setUnsaved = (areas: readonly Area[], unsaved: boolean) => {
    dispatch(videoSetHasChanges({
      ...(areas.includes("cutting") && { cutting: unsaved }),
      ...(areas.includes("tracks") && { tracks: unsaved }),
      ...(areas.includes("thumbnails") && { thumbnails: unsaved }),
    }));
    if (areas.includes("metadata")) { dispatch(metadataSetHasChanges(unsaved)); }
    if (areas.includes("subtitles")) { dispatch(subtitleSetHasChanges(unsaved)); }
    if (areas.includes("chapters")) { dispatch(chapterSetHasChanges(unsaved)); }
  };

  const saveChanges = async (workflowId?: string) => {
    if (!validateSegmentLength(segments)) {
      dispatch(setPostRequestError(t("workflowSelection.error-segmentsTooShort")));
      return;
    }

    // The user can keep editing while we save. Anything they change in the meantime sets the flags again,
    // so these can not simply be cleared once the request is done.
    setUnsaved(AREAS, false);

    const result = await dispatch(postVideoInformation({
      segments: segments,
      tracks: tracks,
      customizedTrackSelection,
      subtitles: prepareSubtitles(subtitles),
      chapters: prepareSubtitles(chapters),
      metadata: metadata,
      workflow: workflowId ? [{ id: workflowId }] : undefined,
      changedAreas,
    }));

    if (postVideoInformation.fulfilled.match(result)) {
      // Opencast forgets the changes once it processes them
      dispatch(workflowId ? clearChangedAreas() : addChangedAreas(unsavedAreas));
      if (workflowId) {
        dispatch(setEnd(true));
      }
    } else {
      // Nothing was saved
      setUnsaved(unsavedAreas, true);
    }
  };

  return (workflowId?: string) => {
    void saveChanges(workflowId);
  };
};
