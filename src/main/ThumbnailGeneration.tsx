import { css } from "@emotion/react";
import { LuCamera, LuChevronLeft } from "react-icons/lu";
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
  selectVideos,
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
import { Track } from "../types";
import Timeline from "./Timeline";
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
} from "../redux/videoSlice";
import { ThemedTooltip } from "./Tooltip";
import { VideoPlayer, VideoPlayerForwardRef } from "./VideoPlayers";
import VideoControls from "./VideoControls";
import { ProtoButton } from "@opencast/appkit";
import {
  DiscardButton,
  ThumbnailButton,
  thumbnailTableRowTitleStyle,
  UploadButton,
} from "./ThumbnailSelect";
import { selectIndex, setIsDisplayEditView } from "../redux/thumbnailSlice";


/**
 * Generate thumbnail from the track by timestamp
 */
const ThumbnailGeneration: React.FC = () => {

  const { t } = useTranslation();

  const theme = useTheme();

  const videoTracks = useAppSelector(selectVideos);
  const index = useAppSelector(selectIndex);
  const primaryTrack = useAppSelector(selectPrimaryThumbnailTrack);

  const track = videoTracks[index];

  // Generate Refs
  const generateRefs = React.useRef<(VideoPlayerForwardRef | null)[]>([]);


  const thumbnailStyle = css({
    display: "flex",
    width: "100%",
    height: "100%",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  });

  const headerRowStyle = css({
    position: "relative",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  });

  const displayAreaStyle = css({
    display: "flex",
    flex: "1 1 0",
    width: "100%",
    maxWidth: "740px",
    minHeight: "0",
    flexDirection: "column",
    alignItems: "center",
    justifySelf: "stretch",
    gap: "18px",
  });

  const playerStyle = css({
    // Mostly just disabling the default styling with this
    aspectRatio: "16 / 9",
    width: "90% !important",
  });

  const horizontalLineStyle = css({
    borderTop: "1px solid #DDD;",
    width: "100%",
  });

  return (
    <div css={thumbnailStyle}>
      <div css={headerRowStyle}>
        { !(settings.thumbnail.simpleMode && primaryTrack !== undefined) &&
          <BackButton />
        }
        <div css={[titleStyle(theme), titleStyleBold(theme)]}>{t("thumbnail.title")}</div>
      </div>
      <div css={[backgroundBoxStyle(theme), displayAreaStyle]}>
        <div css={[thumbnailTableRowTitleStyle, { paddingBottom: 0 }]}>
          {track.flavor.type}
        </div>
        <VideoPlayer
          dataKey={0}
          ref={el => {
            if (generateRefs === undefined) { return; }
            (generateRefs.current[index] = el);
          }}
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
        <div css={horizontalLineStyle} />
        <ThumbnailDisplayer
          track={track}
        />
      </div>
      <div css={videosStyle(theme)}>
        <ThumbnailActions
          generateRefs={generateRefs}
          track={track}
          index={index}
        />
        <Timeline
          timelineHeight={125}
          styleByActiveSegment={false}
          selectIsPlaying={selectIsPlaying}
          selectCurrentlyAt={selectCurrentlyAt}
          setIsPlaying={setIsPlaying}
          setCurrentlyAt={setCurrentlyAt}
          setClickTriggered={setClickTriggered}
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

const ThumbnailActions: React.FC<{
  generateRefs: React.MutableRefObject<(VideoPlayerForwardRef | null)[]>,
  track: Track,
  index: number
}> = ({
  generateRefs,
  track,
  index,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const primaryTrack = useAppSelector(selectPrimaryThumbnailTrack);

  // Generate image and save in redux
  //   *track: Generate to
  //   *index: Generate from
  const generate = (track: Track, index: number) => {
    const time = generateRefs.current[index]?.getCurrentTime();
    const timeObject = time ? { time: time.toString(), flavorType: track.flavor.type } : undefined;
    const uri = generateRefs.current[index]?.captureVideo();
    dispatch(setThumbnail({ id: track.id, uri: uri }));
    dispatch(setThumbnailTime({ id: track.id, time: timeObject }));
    dispatch(setHasChanges(true));
  };

  const thumbnailActionsStyle = css({
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    flexWrap: "wrap",
  });

  const thumbnailButtonStyle = css({
    padding: "16px",
    fontSize: "20px",
    fontWeight: "bold",
  });

  const verticalLineStyle = css({
    borderLeft: "2px solid #DDD;",
    height: "32px",
  });

  return (
    <div css={thumbnailActionsStyle}>
      { (settings.thumbnail.simpleMode && primaryTrack !== undefined) &&
        <>
          <div css={verticalLineStyle} />
          <UploadButton
            track={track}
            index={12}
            overwriteCSS={css([basicButtonStyle(theme), thumbnailButtonStyle])}
          />
        </>
      }
      <div css={verticalLineStyle} />
      <ThumbnailButton
        handler={() => { generate(track, index); }}
        text={t("thumbnail.buttonGenerate")}
        tooltipText={t("thumbnail.buttonGenerate-tooltip")}
        ariaLabel={t("thumbnail.buttonGenerate-tooltip-aria")}
        Icon={LuCamera}
        active={true}
        index={0}
        overwriteCSS={css([basicButtonStyle(theme), thumbnailButtonStyle])}
      />
      <div css={verticalLineStyle} />
      { (settings.thumbnail.simpleMode && primaryTrack !== undefined) &&
        <>
          <DiscardButton
            track={track}
            index={12}
            overwriteCSS={css([basicButtonStyle(theme), thumbnailButtonStyle])}
          />
          <div css={verticalLineStyle} />
        </>
      }

    </div>
  );
};

/**
 * Copied from ThumbnailSelect to fine tune some CSS
 */
const ThumbnailDisplayer: React.FC<{
  track: Track
}> = ({
  track,
}) => {

  const { t } = useTranslation();
  const theme = useTheme();

  const generalStyle = css({
    width: "100%",
    maxWidth: "540px",
    aspectRatio: "16/9",
    flex: "1 1 0",
    minHeight: "0",
    objectFit: "contain",
  });

  const imageStyle = css({
    maxWidth: "457px",
  });

  const placeholderStyle = css({
    width: "100vw", // TODO: This is necessary to make the placeholder large enough, but prevents it from shrinking
    maxWidth: "457px",
    backgroundColor: "grey",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: `${theme.text}`,
  });

  return (
    <>
      {(track.thumbnailUri !== null && track.thumbnailUri !== undefined) ?
        // Thumbnail image
        <img src={track.thumbnailUri}
          alt={t("thumbnail.previewImageAlt") + ": " + track.flavor.type}
          css={[generalStyle, imageStyle]}
        />
        :
        // Placeholder
        <div css={[generalStyle, placeholderStyle]}>
          <span>{t("thumbnail.noThumbnailAvailable")}</span>
        </div>
      }
    </>
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
