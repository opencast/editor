import { useTranslation } from "react-i18next";

import { useAppDispatch, useAppSelector } from "../redux/store";
import {
  selectCustomizedTrackSelection,
  selectHasChanges as videoSelectHasChanges,
  selectSegments,
  selectSelectedWorkflowId,
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
import { serializeSubtitle } from "./utilityFunctions";
import { Segment, SubtitlesInEditor } from "../types";

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
 * Whether the user changed anything since the last save
 */
export const useHasUnsavedChanges = () => {
  const videoChanged = useAppSelector(videoSelectHasChanges);
  const metadataChanged = useAppSelector(metadataSelectHasChanges);
  const subtitleChanged = useAppSelector(subtitleSelectHasChanges);
  const chapterChanged = useAppSelector(chapterSelectHasChanges);
  return videoChanged || metadataChanged || subtitleChanged || chapterChanged;
};

/**
 * Returns a function that sends the current changes to Opencast.
 * If `startWorkflow` is true, the selected workflow is started and the editor ends.
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
  const selectedWorkflowId = useAppSelector(selectSelectedWorkflowId);
  const videoChanged = useAppSelector(videoSelectHasChanges);
  const metadataChanged = useAppSelector(metadataSelectHasChanges);
  const subtitleChanged = useAppSelector(subtitleSelectHasChanges);
  const chapterChanged = useAppSelector(chapterSelectHasChanges);

  const saveChanges = async (startWorkflow: boolean) => {
    if (!validateSegmentLength(segments)) {
      dispatch(setPostRequestError(t("workflowSelection.error-segmentsTooShort")));
      return;
    }

    // The user can keep editing while we save. Anything they change in the meantime sets the flags again,
    // so these can not simply be cleared once the request is done.
    dispatch(videoSetHasChanges(false));
    dispatch(metadataSetHasChanges(false));
    dispatch(subtitleSetHasChanges(false));
    dispatch(chapterSetHasChanges(false));

    const result = await dispatch(postVideoInformation({
      segments: segments,
      tracks: tracks,
      customizedTrackSelection,
      subtitles: prepareSubtitles(subtitles),
      chapters: prepareSubtitles(chapters),
      metadata: metadata,
      workflow: startWorkflow && selectedWorkflowId ? [{ id: selectedWorkflowId }] : undefined,
    }));

    if (postVideoInformation.fulfilled.match(result)) {
      if (startWorkflow) {
        dispatch(setEnd(true));
      }
    } else {
      // Nothing was saved
      if (videoChanged) { dispatch(videoSetHasChanges(true)); }
      if (metadataChanged) { dispatch(metadataSetHasChanges(true)); }
      if (subtitleChanged) { dispatch(subtitleSetHasChanges(true)); }
      if (chapterChanged) { dispatch(chapterSetHasChanges(true)); }
    }
  };

  return (startWorkflow: boolean) => {
    void saveChanges(startWorkflow);
  };
};
