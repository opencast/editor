import React, { useEffect, useRef } from "react";
import { useResizeObserver } from "usehooks-ts";
import { clamp } from "lodash";
import CuttingActions from "./CuttingActions";
import Timeline from "./Timeline";
import {
  fetchVideoInformation,
  selectCurrentlyAt,
  selectDuration,
  selectIsPlaying,
  selectIsMuted,
  selectVolume,
  selectIsPlayPreview,
  selectTitle,
  setClickTriggered,
  setCurrentlyAt,
  setIsPlaying,
  setIsMuted,
  setVolume,
  setIsPlayPreview,
  jumpToPreviousSegment,
  jumpToNextSegment,
  cut,
  mergeAll,
  mergeLeft,
  mergeRight,
} from "../redux/videoSlice";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../redux/store";
import { httpRequestState } from "../types";
import { useTheme } from "../themes";
import { setError } from "../redux/errorSlice";
import { selectTitleFromEpisodeDc } from "../redux/metadataSlice";
import { titleStyle, titleStyleBold, videosStyle } from "../cssStyles";
import { LuHourglass } from "react-icons/lu";
import { css } from "@emotion/react";
import VideoPlayers from "./VideoPlayers";
import VideoControls from "./VideoControls";
import { fetchMetadata, selectGetStatus as selectMetadataGetStatus } from "../redux/metadataSlice";
import { readableErrorMessage } from "../util/utilityFunctions";

// Heights in px
const MAX_VIDEO_HEIGHT = 500;
/** The smallest the videos get. If there is less space, the view scrolls */
const MIN_VIDEO_HEIGHT = 150;
/** The video height to keep while there is space. Only below this does the timeline shrink */
const COMFORTABLE_VIDEO_HEIGHT = 250;
const MAX_TIMELINE_HEIGHT = 260;
const MIN_TIMELINE_HEIGHT = 140;
/** Everything that is neither video nor timeline: title, buttons, controls, paddings and gaps */
const OTHER_HEIGHT = 300;

const Cutting: React.FC = () => {

  const { t } = useTranslation();

  // Init redux variables
  const dispatch = useAppDispatch();
  const videoURLStatus = useAppSelector((state: { videoState: { status: httpRequestState["status"]; }; }) =>
    state.videoState.status);
  const error = useAppSelector((state: { videoState: { error: httpRequestState["error"]; }; }) =>
    state.videoState.error);
  const duration = useAppSelector(selectDuration);
  const theme = useTheme();
  const errorReason = useAppSelector((state: { videoState: { errorReason: httpRequestState["errorReason"]; }; }) =>
    state.videoState.errorReason);
  const metadataGetStatus = useAppSelector(selectMetadataGetStatus);

  // Try to fetch URL from external API
  useEffect(() => {
    if (videoURLStatus === "idle") {
      dispatch(fetchVideoInformation());
    } else if (videoURLStatus === "failed") {
      if (errorReason === "workflowActive") {
        dispatch(setError({
          error: true,
          errorTitle: t("error.workflowActive-errorTitle"),
          errorMessage: t("error.workflowActive-errorMessage"),
          errorIcon: LuHourglass,
        }));
      } else {
        dispatch(setError({
          error: true,
          errorMessage: readableErrorMessage(t, error),
          errorDetails: error,
        }));
      }
    } else if (videoURLStatus === "success") {
      if (duration === null) {
        dispatch(setError({
          error: true,
          errorMessage: t("error.durationError-text"),
          errorDetails: error,
        }));
      }
    }
  }, [videoURLStatus, dispatch, error, t, errorReason, duration]);

  // Already try fetching Metadata to reduce wait time
  useEffect(() => {
    if (metadataGetStatus === "idle") {
      dispatch(fetchMetadata());
    }
  }, [metadataGetStatus, dispatch]);

  // Make the timeline and the videos fit into the available height, if possible.
  // The videos take up whatever space the timeline leaves free, so the timeline shrinks first
  // once the videos are down to a reasonable size.
  const cuttingRef = useRef<HTMLDivElement>(null);
  const { height: availableHeight } = useResizeObserver({ ref: cuttingRef as React.RefObject<HTMLDivElement> });
  const timelineHeight = availableHeight === undefined
    ? MAX_TIMELINE_HEIGHT
    : clamp(availableHeight - OTHER_HEIGHT - COMFORTABLE_VIDEO_HEIGHT, MIN_TIMELINE_HEIGHT, MAX_TIMELINE_HEIGHT);

  // Style
  const cuttingStyle = css({
    display: "flex",
    width: "auto",
    // Fill the main content area. If that is too small to fit everything at the minimum sizes,
    // the content scrolls instead of squeezing further.
    height: "100%",
    minHeight: `${OTHER_HEIGHT + MIN_TIMELINE_HEIGHT + MIN_VIDEO_HEIGHT}px`,
    flexDirection: "column",
    alignItems: "center",
  });

  // The video area is as tall as the videos are by default (determined by their width).
  // It only shrinks, and the videos with it, if the timeline needs the space (see minHeight of cuttingStyle).
  const videoAreaStyle = css({
    flex: "0 1 auto",
    // No minimum height here: it would make the area taller than the videos need at narrow widths
    minHeight: 0,
    maxHeight: `${MAX_VIDEO_HEIGHT}px`,
    width: "100%",
    // Let the video players fill the area
    "& > div": { height: "100%" },
  });

  return (
    <div css={cuttingStyle} ref={cuttingRef}>
      <CuttingHeader />
      <div css={videoAreaStyle}>
        <VideoPlayers maxHeightInPixel={MAX_VIDEO_HEIGHT} />
      </div>
      <div css={videosStyle(theme)}>
        <Timeline
          timelineHeight={timelineHeight}
          selectIsPlaying={selectIsPlaying}
          selectCurrentlyAt={selectCurrentlyAt}
          setIsPlaying={setIsPlaying}
          setCurrentlyAt={setCurrentlyAt}
          setClickTriggered={setClickTriggered}
        />
        <CuttingActions
          cut={cut}
          mergeAll={mergeAll}
          mergeLeft={mergeLeft}
          mergeRight={mergeRight}
        />
        <VideoControls
          selectCurrentlyAt={selectCurrentlyAt}
          selectIsPlaying={selectIsPlaying}
          selectIsMuted={selectIsMuted}
          selectVolume={selectVolume}
          selectIsPlayPreview={selectIsPlayPreview}
          setCurrentlyAt={setCurrentlyAt}
          setIsPlaying={setIsPlaying}
          setIsMuted={setIsMuted}
          setVolume={setVolume}
          setIsPlayPreview={setIsPlayPreview}
          jumpToPreviousSegment={jumpToPreviousSegment}
          jumpToNextSegment={jumpToNextSegment}
        />
      </div>
    </div>
  );
};


const CuttingHeader: React.FC = () => {

  const title = useAppSelector(selectTitle);
  const metadataTitle = useAppSelector(selectTitleFromEpisodeDc);
  const theme = useTheme();

  return (
    <div css={[titleStyle(theme), titleStyleBold(theme)]}>
      {metadataTitle ? metadataTitle : title}
    </div>
  );
};

export default Cutting;
