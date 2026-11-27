import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../redux/store";
import SubtitleListEditor from "./SubtitleListEditor";
import { useEffect, useState } from "react";
import SubtitleVideoArea from "./SubtitleVideoArea";
import Timeline from "./Timeline";
import {
  addCueAtIndex,
  cut,
  mergeAll,
  removeCue,
  selectAspectRatio,
  selectClickTriggered,
  selectCurrentlyAt,
  selectCurrentlyAtInSeconds,
  selectFocusSegmentId,
  selectFocusSegmentTriggered,
  selectFocusSegmentTriggered2,
  selectIsPlaying,
  selectIsPlayPreview,
  selectPreviewTriggered,
  selectSelectedSubtitleById,
  selectSelectedSubtitleId,
  setAspectRatio,
  setClickTriggered,
  setCueAtIndex,
  setCurrentlyAt,
  setCurrentlyAtAndTriggerPreview,
  setFocusSegmentTriggered,
  setFocusSegmentTriggered2,
  setFocusToSegmentAboveId,
  setFocusToSegmentBelowId,
  setIsPlaying,
  setIsPlayPreview,
  setPreviewTriggered,
  setSubtitle,
  initializeSubtitle,
  setSelectedSubtitleId,
  deleteByMerge,
} from "../redux/chapterSlice";
import { css } from "@emotion/react";
import { useTheme } from "../themes";
import { titleStyle, titleStyleBold } from "../cssStyles";
import {
  selectChaptersFromOpencast,
  selectDuration,
} from "../redux/videoSlice";
import { parseSubtitle } from "../util/utilityFunctions";
import { v4 as uuidv4 } from "uuid";
import CuttingActions from "./CuttingActions";

/**
 * Displays an editor view for a selected subtitle file
 */
const Chapter: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const [getError, setGetError] = useState<string | undefined>(undefined);

  const subtitle = useAppSelector(selectSelectedSubtitleById);
  const selectedId = useAppSelector(selectSelectedSubtitleId);
  // Assume only one chapter track
  const captionTracks = useAppSelector(state => selectChaptersFromOpencast(state));
  const captionTrack = captionTracks[0] ?? undefined;
  const duration = useAppSelector(selectDuration);

  // Prepare subtitle in redux
  useEffect(() => {
    // Parse subtitle data from Opencast
    if (subtitle?.cues === undefined && captionTrack !== undefined && captionTrack.subtitle !== undefined
      && !selectedId) {
      try {
        dispatch(setSelectedSubtitleId(captionTrack.id));
        dispatch(setSubtitle({
          identifier: captionTrack.id,
          subtitles: { cues: parseSubtitle(captionTrack.subtitle), tags: captionTrack.tags, deleted: false },
        }));
      } catch (error) {
        if (error instanceof Error) {
          setGetError(error.message);
        } else {
          setGetError(String(error));
        }
      }

      // Or create a new subtitle instead
    } else if (subtitle?.cues === undefined && captionTrack === undefined && !selectedId) {
      // Create an empty subtitle
      // const newId = uuidv4();
      dispatch(initializeSubtitle({ identifier: uuidv4(), subtitles: { cues: [{
        id: undefined,
        idInternal: uuidv4(),
        text: "",
        startTime: 0,
        endTime: duration,
        tree: { children: [{ type: "text", value: "" }] },
      }], tags: [], deleted: false } }));
    }
  }, [dispatch, captionTrack, subtitle, selectedId, duration]);

  const subtitleEditorStyle = css({
    display: "flex",
    flexDirection: "column",
    paddingRight: "20px",
    paddingLeft: "20px",
    gap: "20px",
    height: "100%",
  });

  const headerRowStyle = css({
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    gap: "10px",
    padding: "15px",
  });

  const subAreaStyle = css({
    display: "flex",
    flexDirection: "row",
    flexGrow: 1,  // No fixed height, fill available space
    justifyContent: "space-between",
    alignItems: "top",
    width: "100%",
    paddingTop: "10px",
    paddingBottom: "10px",
    gap: "30px",
    borderBottom: `${theme.menuBorder}`,
  });

  const render = () => {
    if (getError !== undefined) {
      return (
        <span>{"Subtitle Parsing Error(s): " + getError}</span>
      );
    } else {
      return (
        <>
          <div css={headerRowStyle}>
            <div css={[titleStyle(theme), titleStyleBold(theme), { padding: "0px" }]}>
              {t("chapters.editTitle")}
            </div>
          </div>
          <div css={subAreaStyle}>
            <SubtitleListEditor
              defaultSegmentLength={duration}
              segmentHeight={60}
              segmentTextHeight={"20px"}
              isFunctionButtonEnabled={false}
              isChapterInputs={true}
              selectSelectedSubtitleById={selectSelectedSubtitleById}
              selectSelectedSubtitleId={selectSelectedSubtitleId}
              selectCurrentlyAt={selectCurrentlyAt}
              selectFocusSegmentId={selectFocusSegmentId}
              selectFocusSegmentTriggered={selectFocusSegmentTriggered}
              selectFocusSegmentTriggered2={selectFocusSegmentTriggered2}
              addCueAtIndex={addCueAtIndex}
              removeCue={removeCue}
              setCueAtIndex={setCueAtIndex}
              setCurrentlyAt={setCurrentlyAt}
              setIsPlaying={setIsPlaying}
              setFocusSegmentTriggered={setFocusSegmentTriggered}
              setFocusSegmentTriggered2={setFocusSegmentTriggered2}
              setFocusToSegmentAboveId={setFocusToSegmentAboveId}
              setFocusToSegmentBelowId={setFocusToSegmentBelowId}
            />
            <SubtitleVideoArea
              showAllVideosByDefault={true}
              selectIsPlaying={selectIsPlaying}
              selectCurrentlyAt={selectCurrentlyAt}
              selectCurrentlyAtInSeconds={selectCurrentlyAtInSeconds}
              selectClickTriggered={selectClickTriggered}
              selectPreviewTriggered={selectPreviewTriggered}
              selectAspectRatio={selectAspectRatio}
              selectIsPlayPreview={selectIsPlayPreview}
              selectSelectedSubtitleById={selectSelectedSubtitleById}
              setIsPlaying={setIsPlaying}
              setPreviewTriggered={setPreviewTriggered}
              setAspectRatio={setAspectRatio}
              setIsPlayPreview={setIsPlayPreview}
              setClickTriggered={setClickTriggered}
              setCurrentlyAtAndTriggerPreview={setCurrentlyAtAndTriggerPreview}
            />
          </div>
          <div>
            <Timeline
              selectCurrentlyAt={selectCurrentlyAt}
              selectIsPlaying={selectIsPlaying}
              setClickTriggered={setClickTriggered}
              setCurrentlyAt={setCurrentlyAt}
              setIsPlaying={setIsPlaying}
              isChapters={true}
            />
          </div>
          <CuttingActions
            add={cut}
            deleteByMerge={deleteByMerge}
            deleteByMergeAll={mergeAll}
            isDeleteButtonDisabled={true}
          />
        </>
      );
    }
  };

  return (
    <div css={subtitleEditorStyle}>
      {render()}
    </div>
  );
};

export default Chapter;
