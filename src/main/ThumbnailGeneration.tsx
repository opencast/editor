import { css } from "@emotion/react";
import { LuChevronLeft } from "react-icons/lu";
import React from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../redux/store";
import { settings } from "../config";
import {
  basicButtonStyle, titleStyle, titleStyleBold, videosStyle,
  backgroundBoxStyle,
} from "../cssStyles";
import { useTheme } from "../themes";
import {
  selectTracks,
  setHasChanges,
  setThumbnail,
  selectCurrentlyAtInSeconds,
  selectPreviewTriggered,
  selectClickTriggered,
  selectJumpTriggered,
  selectAspectRatio,
  setPreviewTriggered,
  setJumpTriggered,
  setAspectRatio,
  selectPrimaryThumbnailTrack,
  setThumbnailTime,
} from "../redux/videoSlice";
import Timeline from "./Timeline";
import { ZoomDropdown, ZoomSlider } from "./CuttingActions";
import {
  selectIsPlaying,
  selectIsMuted,
  selectVolume,
  selectCurrentlyAt,
  setIsPlaying,
  selectIsPlayPreview,
  setIsPlayPreview,
  setClickTriggered,
  setIsMuted,
  setVolume,
  setCurrentlyAt,
  jumpToPreviousSegment,
  jumpToNextSegment,
  timelineZoomIn,
  timelineZoomOut,
} from "../redux/videoSlice";
import { ThemedTooltip } from "./Tooltip";
import { VideoPlayer, VideoPlayerForwardRef } from "./VideoPlayers";
import VideoControls from "./VideoControls";
import { ProtoButton } from "@opencast/appkit";
import {
  GeneratedMessage,
  ThumbnailButtons,
  ThumbnailDisplayer,
  thumbnailCardStyle,
  thumbnailMediaStyle,
  thumbnailPageStyle,
  thumbnailTableRowTitleStyle,
} from "./ThumbnailSelect";
import { selectIndex, setGeneratedAt, setIsDisplayEditView } from "../redux/thumbnailSlice";
import { selectKeymap } from "../redux/hotkeySlice";
import { useHotkeys } from "react-hotkeys-hook";
import { rewriteKeys } from "../globalKeys";
import { ActionCreatorWithoutPayload, ActionCreatorWithPayload } from "@reduxjs/toolkit";


/**
 * Generate thumbnail from the track by timestamp
 */
const ThumbnailGeneration: React.FC = () => {

  const { t } = useTranslation();

  const theme = useTheme();
  const dispatch = useAppDispatch();

  const tracks = useAppSelector(selectTracks);
  const index = useAppSelector(selectIndex);
  const primaryTrack = useAppSelector(selectPrimaryThumbnailTrack);

  // Simple mode only ever edits the primary track
  const simpleModeTrack = settings.thumbnail.simpleMode ? primaryTrack : undefined;
  const isSimpleMode = simpleModeTrack !== undefined;
  const track = simpleModeTrack ?? tracks[index];

  const playerRef = React.useRef<VideoPlayerForwardRef>(null);

  // Generate image and save in redux
  const generate = () => {
    const uri = playerRef.current?.captureVideo();
    if (uri === undefined) {
      return;
    }
    const time = playerRef.current?.getCurrentTime();
    const timeObject = time ? { time: time.toString(), flavorType: track.flavor.type } : undefined;
    dispatch(setThumbnail({ id: track.id, uri: uri }));
    dispatch(setThumbnailTime({ id: track.id, time: timeObject }));
    dispatch(setHasChanges({ thumbnails: true }));
    dispatch(setGeneratedAt(Date.now()));
    // Show the result. Simple mode has nowhere to go back to, so it shows the result here.
    if (!isSimpleMode) {
      dispatch(setIsDisplayEditView(false));
    }
  };

  const headerRowStyle = css({
    position: "relative",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  });

  // The player needs a parent with a fixed size to fill
  const playerBoxStyle = css([thumbnailMediaStyle, {
    display: "flex",
  }]);

  const playerStyle = css({
    // Mostly just disabling the default styling with this
    aspectRatio: "16 / 9",
    width: "100% !important",
  });

  const horizontalLineStyle = css({
    borderTop: "1px solid #DDD;",
    width: "100%",
  });

  return (
    <div css={thumbnailPageStyle}>
      <div css={headerRowStyle}>
        { !isSimpleMode && <BackButton /> }
        <div css={[titleStyle(theme), titleStyleBold(theme)]}>{t("thumbnail.title")}</div>
        {isSimpleMode && <GeneratedMessage />}
      </div>
      <div css={[backgroundBoxStyle(theme), thumbnailCardStyle]}>
        <div css={thumbnailTableRowTitleStyle}>
          {t("thumbnail.new-title", { track: track.flavor.type })}
        </div>
        <div css={playerBoxStyle}>
          <VideoPlayer
            dataKey={0}
            ref={playerRef}
            url={track.uri}
            isPrimary={true}
            subtitleUrl={""}
            first={true}
            last={true}
            overwritePlayerCSS={playerStyle}
            selectIsPlaying={selectIsPlaying}
            selectIsMuted={selectIsMuted}
            selectCurrentlyAtInSeconds={selectCurrentlyAtInSeconds}
            selectPreviewTriggered={selectPreviewTriggered}
            selectClickTriggered={selectClickTriggered}
            selectJumpTriggered={selectJumpTriggered}
            selectAspectRatio={selectAspectRatio}
            setIsPlaying={setIsPlaying}
            selectVolume={selectVolume}
            setPreviewTriggered={setPreviewTriggered}
            setClickTriggered={setClickTriggered}
            setJumpTriggered={setJumpTriggered}
            setCurrentlyAt={setCurrentlyAt}
            setAspectRatio={setAspectRatio}
          />
        </div>
        {isSimpleMode &&
          <>
            <div css={horizontalLineStyle} />
            <ThumbnailDisplayer track={track} />
          </>
        }
        <ThumbnailButtons
          track={track}
          onGenerate={generate}
          opensGeneration={false}
          generating={!isSimpleMode}
          allowUseForAll={!isSimpleMode && tracks.length > 1}
        />
      </div>
      <div css={videosStyle(theme)}>
        <Timeline
          timelineHeight={125}
          styleByActiveSegment={false}
          selectIsPlaying={selectIsPlaying}
          selectCurrentlyAt={selectCurrentlyAt}
          setIsPlaying={setIsPlaying}
          setCurrentlyAt={setCurrentlyAt}
          setClickTriggered={setClickTriggered}
        />
        <ZoomControls />
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

/**
 * Zoom for the timeline
 */
const ZoomControls: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const keymap = useAppSelector(selectKeymap);

  // Callback for the zoom slider/dropdown, dispatching the zoom action to redux
  const dispatchZoomAction = (
    action: ActionCreatorWithoutPayload<string> | undefined,
    actionWithPayload: ActionCreatorWithPayload<number, string> | undefined,
    payload: number,
  ) => {
    if (action) {
      dispatch(action());
    }
    if (actionWithPayload) {
      dispatch(actionWithPayload(payload));
    }
  };

  // Hotkeys for zooming, shared with the Cutting/Chapter/Subtitle timelines
  useHotkeys(
    keymap.cutting.zoomIn.key,
    () => dispatch(timelineZoomIn()),
    keymap.cutting.zoomIn.options,
    [],
  );
  useHotkeys(
    keymap.cutting.zoomOut.key,
    () => dispatch(timelineZoomOut()),
    keymap.cutting.zoomOut.options,
    [],
  );

  const zoomStyle = css({
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  });

  return (
    <div css={zoomStyle}>
      <ZoomSlider actionHandler={dispatchZoomAction}
        tooltip={t("cuttingActions.zoomSlider-tooltip", {
          hotkeyNameIn: rewriteKeys(keymap.cutting.zoomIn.key),
          hotkeyNameOut: rewriteKeys(keymap.cutting.zoomOut.key),
        })}
        ariaLabelText={t("cuttingActions.zoomSlider-aria", {
          hotkeyNameIn: rewriteKeys(keymap.cutting.zoomIn.key),
          hotkeyNameOut: rewriteKeys(keymap.cutting.zoomOut.key),
        })}
      />
      <ZoomDropdown />
    </div>
  );
};

/**
 * Takes you to a different page
 */
export const BackButton: React.FC = () => {

  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const backButtonStyle = css({
    position: "absolute",
    top: "20%",
    left: "2%",
    background: "",
    padding: "8px",
  });

  return (
    <ThemedTooltip title={t("thumbnail.backButton-tooltip")}>
      <ProtoButton
        aria-label={t("thumbnail.backButton-tooltip")}
        onClick={() => dispatch(setIsDisplayEditView(false))}
        css={[basicButtonStyle(theme), backButtonStyle]}
      >
        <LuChevronLeft css={{ fontSize: 24 }} />
        <span>{t("thumbnail.backButton")}</span>
      </ProtoButton>
    </ThemedTooltip>
  );
};


export default ThumbnailGeneration;
