import React, { useEffect, useState } from "react";
import { css } from "@emotion/react";
import { ProtoButton } from "@opencast/appkit";
import { IconType } from "react-icons";
import {
  LuAudioLines, LuChevronLeft, LuChevronRight, LuColumns2, LuLayoutGrid, LuMonitor, LuVideo,
} from "react-icons/lu";
import Select from "react-select";
import { RootState, ThunkApiConfig, useAppDispatch, useAppSelector } from "../redux/store";
import {
  selectIsMuted,
  selectTracks,
  selectVolume,
  selectJumpTriggered,
  setIsMuted,
  setVolume,
  setJumpTriggered,
} from "../redux/videoSlice";
import { SubtitlesInEditor, Track } from "../types";
import { settings } from "../config";
import { useTranslation } from "react-i18next";
import { serializeSubtitle } from "../util/utilityFunctions";
import { useTheme } from "../themes";
import { VideoPlayer } from "./VideoPlayers";
import VideoControls from "./VideoControls";
import { backgroundBoxStyle, selectFieldStyle } from "../cssStyles";
import { COLORS } from "../util/appkit";
import { ActionCreatorWithPayload, AsyncThunk } from "@reduxjs/toolkit";
import { setCurrentlyAt } from "../redux/subtitleSlice";

/**
 * A part of the subtitle editor that displays the videos and related controls
 *
 * The user can look at all videos at once, or at just one of them.
 * If there are too many videos for the space, they are shown in pages.
 * If the settings define a default video, that one is shown first.
 */
const SubtitleVideoArea: React.FC<{
  showAllVideosByDefault?: boolean,
  selectIsPlaying: (state: RootState) => boolean,
  selectCurrentlyAt: (state: RootState) => number,
  selectCurrentlyAtInSeconds: (state: RootState) => number,
  selectClickTriggered: (state: RootState) => boolean,
  selectPreviewTriggered: (state: RootState) => boolean,
  selectAspectRatio: (state: RootState) => number,
  selectIsPlayPreview: (state: RootState) => boolean,
  selectSelectedSubtitleById: (state: RootState) => SubtitlesInEditor,
  setIsPlaying: ActionCreatorWithPayload<boolean, string>,
  setPreviewTriggered: ActionCreatorWithPayload<boolean, string>,
  setAspectRatio: ActionCreatorWithPayload<{ dataKey: number; } & { width: number, height: number; }, string>,
  setIsPlayPreview: ActionCreatorWithPayload<boolean, string>,
  setClickTriggered: ActionCreatorWithPayload<boolean, string>,
  setCurrentlyAtAndTriggerPreview: AsyncThunk<void, number, ThunkApiConfig>,
}> = ({
  showAllVideosByDefault = false,
  selectIsPlaying,
  selectCurrentlyAt,
  selectCurrentlyAtInSeconds,
  selectClickTriggered,
  selectPreviewTriggered,
  selectAspectRatio,
  selectIsPlayPreview,
  selectSelectedSubtitleById,
  setIsPlaying,
  setPreviewTriggered,
  setAspectRatio,
  setIsPlayPreview,
  setClickTriggered,
  setCurrentlyAtAndTriggerPreview,
}) => {

  const dispatch = useAppDispatch();
  const theme = useTheme();
  const tracks = useAppSelector(selectTracks);
  const isPlaying = useAppSelector(selectIsPlaying);
  const subtitle = useAppSelector(selectSelectedSubtitleById);
  const [subtitleUrl, setSubtitleUrl] = useState("");
  const [page, setPage] = useState(0);

  // Which video to look at. Either the id of a track, or "all".
  const [selectedView, setSelectedView] = useState<string>(() => {
    // Get default from settings
    const defaultFlavor = settings.subtitles.defaultVideoFlavor;
    const defaultTrack = tracks.find(track => track.flavor.type === defaultFlavor?.type
      && track.flavor.subtype === defaultFlavor?.subtype);
    if (defaultTrack) {
      return defaultTrack.id;
    }
    // If there is no default, show everything or just pick any
    return showAllVideosByDefault ? ALL_VIEW : (tracks[0]?.id ?? ALL_VIEW);
  });

  // The selection may be outdated or meaningless, e.g. when there is only a single video
  const view = tracks.length > 1 && (selectedView === ALL_VIEW || tracks.some(track => track.id === selectedView))
    ? selectedView
    : (tracks[0]?.id ?? ALL_VIEW);
  const pageCount = view === ALL_VIEW ? Math.ceil(tracks.length / VIDEOS_PER_PAGE) : 1;
  const currentPage = Math.min(page, pageCount - 1);
  const shownTracks = getShownTracks(tracks, view, currentPage);

  // The player that controls the playback. Prefer one that has sound.
  const primaryTrack = shownTracks.find(track => track.audio_stream.available) ?? shownTracks[0];

  const show = (newView: string, newPage: number) => {
    const isNewVideoShown = getShownTracks(tracks, newView, newPage).some(track => !shownTracks.includes(track));
    // A video that was not shown before starts from the beginning, so it would not be in sync with the others
    if (isNewVideoShown && isPlaying) {
      dispatch(setIsPlaying(false));
    }
    setSelectedView(newView);
    setPage(newPage);
  };

  // Parse subtitles to something the video player understands
  useEffect(() => {
    if (subtitle?.cues) {
      const serializedSubtitle = serializeSubtitle(subtitle?.cues);
      setSubtitleUrl(window.URL.createObjectURL(new Blob([serializedSubtitle], { type: "text/vtt" })));
    }
  }, [subtitle?.cues]);

  const areaWrapper = css({
    display: "block",
    height: "100%",
    width: "40%",
    // Line up with the first row of the list, which has the same padding above it
    boxSizing: "border-box",
    paddingTop: "10px",
  });

  const videoPlayerAreaStyle = css({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    gap: "10px",
  });

  const viewBarStyle = css({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "10px",
    width: "100%",
  });

  const previewStyle = css({
    boxSizing: "border-box",
    width: "100%",
    aspectRatio: "16 / 9",
    display: "grid",
    gridTemplateColumns: `repeat(${shownTracks.length > 1 ? 2 : 1}, minmax(0, 1fr))`,
    alignContent: "center",
    columnGap: "10px",
    // Two rows of 16:9 cards need less than the full gap to fit into the 16:9 box.
    // Otherwise the box grows a little on pages with two rows, and everything around it moves.
    rowGap: "6px",
  });

  return (
    <div css={areaWrapper}>
      <div css={videoPlayerAreaStyle}>
        {tracks.length > 1 && (
          <div css={viewBarStyle}>
            {pageCount > 1 &&
              <Pager
                page={currentPage}
                pageCount={pageCount}
                total={tracks.length}
                changePage={newPage => show(view, newPage)}
              />}
            {tracks.length > MAX_TRACKS_AS_BUTTONS
              ? <ViewSelect tracks={tracks} view={view} changeView={newView => show(newView, 0)} />
              : <ViewSwitch tracks={tracks} view={view} changeView={newView => show(newView, 0)} />}
          </div>
        )}
        <div css={previewStyle}>
          {shownTracks.map(track => {
            const index = tracks.indexOf(track);
            const isPrimary = track === primaryTrack;
            return (
              <VideoTile key={track.id} label={getFlavorLabel(track, tracks)}>
                <VideoPlayer
                  dataKey={index}
                  url={track.uri}
                  isPrimary={isPrimary}
                  // Only one video shows the subtitles. Showing them on every video would be too much.
                  subtitleUrl={isPrimary ? subtitleUrl : ""}
                  first={true}
                  last={true}
                  audioOnly={!track.video_stream.available}
                  overwritePlayerCSS={[backgroundBoxStyle(theme), css({
                    aspectRatio: "16 / 9",
                    // Smaller than elsewhere, because there can be several videos in little space
                    padding: track.video_stream.available ? "8px" : 0,
                    overflow: "hidden",
                    backgroundColor: theme.audio_only_bg,
                  })]}
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
                  setCurrentlyAt={setCurrentlyAtAndTriggerPreview}
                  setAspectRatio={setAspectRatio}
                />
              </VideoTile>
            );
          })}
        </div>
        {/* TODO: Make preview mode work or remove it */}
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
        />
      </div>
    </div>
  );
};

const ALL_VIEW = "all";

// More videos than this are shown in pages, because they would not fit into the space
const VIDEOS_PER_PAGE = 4;
// More videos than this are chosen from a dropdown, because the buttons would not fit into the space
const MAX_TRACKS_AS_BUTTONS = 3;

const getShownTracks = (tracks: Track[], view: string, page: number) =>
  view === ALL_VIEW
    ? tracks.slice(page * VIDEOS_PER_PAGE, (page + 1) * VIDEOS_PER_PAGE)
    : tracks.filter(track => track.id === view);

/**
 * Name of a video for the user
 */
const getFlavorLabel = (track: Track, tracks: Track[]) => {
  // Omit subtype if all flavour subtypes are equal
  if (tracks.every(other => other.flavor.subtype === tracks[0].flavor.subtype)) {
    return track.flavor.type;
  }
  return track.flavor.type + "/" + track.flavor.subtype;
};

const getTrackIcon = (track: Track): IconType => {
  if (!track.video_stream.available) {
    return LuAudioLines;
  }
  return track.flavor.type === "presentation" ? LuMonitor : LuVideo;
};

/**
 * A video with its name in the corner
 */
const VideoTile: React.FC<React.PropsWithChildren<{
  label: string,
}>> = ({ label, children }) => {

  const tileStyle = css({
    position: "relative",
    minWidth: 0,
    aspectRatio: "16 / 9",
    overflow: "hidden",
  });

  // A solid color, so that the text is readable on any video
  const labelStyle = css({
    position: "absolute",
    top: "8px",
    left: "8px",
    zIndex: 1,
    padding: "2px 8px",
    borderRadius: "4px",
    backgroundColor: "#000",
    color: "#fff",
    fontSize: "12px",
    pointerEvents: "none",
  });

  return (
    <div role="group" aria-label={label} css={tileStyle}>
      {children}
      <span css={labelStyle}>{label}</span>
    </div>
  );
};

/**
 * Chooses which videos are shown: either one of them, or all of them
 */
const ViewSwitch: React.FC<{
  tracks: Track[],
  view: string,
  changeView: (view: string) => void,
}> = ({ tracks, view, changeView }) => {

  const { t } = useTranslation();
  const theme = useTheme();

  const options: { id: string, label: string, Icon: IconType }[] = [
    ...tracks.map(track => ({ id: track.id, label: getFlavorLabel(track, tracks), Icon: getTrackIcon(track) })),
    tracks.length === 2
      ? { id: ALL_VIEW, label: t("subtitleVideoArea.viewBoth-button"), Icon: LuColumns2 }
      : { id: ALL_VIEW, label: t("subtitleVideoArea.viewAll-button"), Icon: LuLayoutGrid },
  ];

  const groupStyle = css({
    display: "inline-flex",
    flexWrap: "wrap",
    gap: "2px",
    padding: "3px",
    border: theme.menuBorder,
    borderRadius: "10px",
  });

  const buttonStyle = (isActive: boolean) => css({
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    height: "32px",
    padding: "0 12px 0 10px",
    borderRadius: "7px",
    // The accent color marks the active element, like in the main menu
    border: `1px solid ${isActive ? theme.accent_color : "transparent"}`,
    backgroundColor: isActive ? theme.accent_bg : "transparent",
    color: isActive ? theme.accent_color : theme.text,
    "&:hover": { borderColor: theme.accent_color },
  });

  return (
    <div role="group" aria-label={t("subtitleVideoArea.view-label")} css={groupStyle}>
      {options.map(({ id, label, Icon }) =>
        <ProtoButton
          key={id}
          aria-pressed={view === id}
          onClick={() => changeView(id)}
          css={buttonStyle(view === id)}
        >
          <Icon size={18} aria-hidden="true" />
          {label}
        </ProtoButton>,
      )}
    </div>
  );
};

/**
 * Like the ViewSwitch, but takes less space when there are many videos
 */
const ViewSelect: React.FC<{
  tracks: Track[],
  view: string,
  changeView: (view: string) => void,
}> = ({ tracks, view, changeView }) => {

  const { t } = useTranslation();
  const theme = useTheme();

  const options = [
    ...tracks.map(track => ({ value: track.id, label: getFlavorLabel(track, tracks) })),
    { value: ALL_VIEW, label: t("subtitleVideoArea.viewAll-button") },
  ];

  return (
    <Select
      aria-label={t("subtitleVideoArea.view-label")}
      styles={selectFieldStyle(theme)}
      isMulti={false}
      css={{ flex: "0 1 220px", minWidth: 0 }}
      options={options}
      value={options.find(option => option.value === view)}
      onChange={newValue => newValue && changeView(newValue.value)}
    />
  );
};

/**
 * Goes through the pages of videos
 */
const Pager: React.FC<{
  page: number,
  pageCount: number,
  total: number,
  changePage: (page: number) => void,
}> = ({ page, pageCount, total, changePage }) => {

  const { t } = useTranslation();
  const theme = useTheme();

  const pagerStyle = css({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "14px",
  });

  const buttonStyle = css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "7px",
    border: "1px solid transparent",
    color: theme.text,
    "&:hover:not([aria-disabled='true'])": { borderColor: theme.accent_color },
    // A fixed color instead of opacity, which would reduce the contrast in high contrast modes
    "&[aria-disabled='true']": { color: COLORS.neutral60, cursor: "default" },
  });

  const first = page * VIDEOS_PER_PAGE + 1;
  const last = Math.min(total, (page + 1) * VIDEOS_PER_PAGE);

  return (
    <div css={pagerStyle}>
      <ProtoButton
        aria-label={t("subtitleVideoArea.previousPage-button")}
        aria-disabled={page <= 0}
        onClick={() => page > 0 && changePage(page - 1)}
        css={buttonStyle}
      >
        <LuChevronLeft size={20} aria-hidden="true" />
      </ProtoButton>
      <span aria-live="polite">{t("subtitleVideoArea.pageStatus", { first, last, total })}</span>
      <ProtoButton
        aria-label={t("subtitleVideoArea.nextPage-button")}
        aria-disabled={page >= pageCount - 1}
        onClick={() => page < pageCount - 1 && changePage(page + 1)}
        css={buttonStyle}
      >
        <LuChevronRight size={20} aria-hidden="true" />
      </ProtoButton>
    </div>
  );
};

export default SubtitleVideoArea;
