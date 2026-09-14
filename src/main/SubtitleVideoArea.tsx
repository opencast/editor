import React, { useEffect, useState } from "react";
import { css } from "@emotion/react";
import { RootState, ThunkApiConfig, useAppSelector } from "../redux/store";
import {
  selectIsMuted,
  selectTracks,
  selectVolume,
  selectJumpTriggered,
  setIsMuted,
  setVolume,
  setJumpTriggered,
} from "../redux/videoSlice";
import { Flavor, SubtitlesInEditor } from "../types";
import { settings } from "../config";
import { useTranslation } from "react-i18next";
import { serializeSubtitle } from "../util/utilityFunctions";
import { useTheme } from "../themes";
import { VideoPlayer } from "./VideoPlayers";
import VideoControls from "./VideoControls";
import Select from "react-select";
import { selectFieldStyle } from "../cssStyles";
import { ActionCreatorWithPayload, AsyncThunk } from "@reduxjs/toolkit";
import { setCurrentlyAt } from "../redux/subtitleSlice";

/**
 * A part of the subtitle editor that displays a video and related controls
 *
 * A bug in the react-player module prevents hotloading subtitle files:
 * https://github.com/cookpete/react-player/issues/1162
 * We have "fixed" this in a fork https://github.com/Arnei/react-player, because
 * coming up with a proper fix appears to be rather difficult
 * TODO: Come up with a proper fix and create a PR
 */
const SubtitleVideoArea: React.FC<{
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

  const tracks = useAppSelector(selectTracks);
  const subtitle = useAppSelector(selectSelectedSubtitleById);
  const [selectedFlavor, setSelectedFlavor] = useState<Flavor>();
  const [subtitleUrl, setSubtitleUrl] = useState("");

  // Decide on initial flavor on mount
  useEffect(() => {
    // Get default from settings
    if (settings.subtitles.defaultVideoFlavor !== undefined) {
      setSelectedFlavor(settings.subtitles.defaultVideoFlavor);
      return;
    }
    // If there is no default, just pick any
    if (tracks.length > 0) {
      setSelectedFlavor(tracks[0].flavor);
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get the uri of a track the currently selected flavor
  const getTrackURIBySelectedFlavor = () => {
    for (const track of tracks) {
      if (track.flavor.type === selectedFlavor?.type && track.flavor.subtype === selectedFlavor?.subtype) {
        return track.uri;
      }
    }
  };

  // Get a track URI by any means necessary
  const getTrackURI = () => {
    const trackURIByFlavor = getTrackURIBySelectedFlavor();
    if (trackURIByFlavor) {
      return trackURIByFlavor;
    }
    if (tracks.length > 0) {
      return tracks[0].uri;
    }
  };

  const isAudioOnly = () => {
    for (const track of tracks) {
      if (track.flavor.type === selectedFlavor?.type && track.flavor.subtype === selectedFlavor?.subtype) {
        return !track.video_stream.available;
      }
    }
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
  });

  const videoPlayerAreaStyle = css({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    gap: "10px",
  });

  const render = () => {
    return (
      <div css={areaWrapper}>
        <div css={videoPlayerAreaStyle}>
          {selectedFlavor && <VideoSelectDropdown
            flavors={tracks.reduce((a: Flavor[], o: { flavor: Flavor; }) => (a.push(o.flavor), a), [])}
            changeFlavorcallback={setSelectedFlavor}
            defaultFlavor={selectedFlavor}
          />}
          {/* TODO: Make preview mode work or remove it */}
          <VideoPlayer
            dataKey={0}
            url={getTrackURI()}
            isPrimary={true}
            subtitleUrl={subtitleUrl}
            first={true}
            last={true}
            audioOnly={isAudioOnly()}
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

  return (
    <>
      {render()}
    </>
  );
};

/**
 * Changes the selectedFlavor in SubtitleVideoArea
 */
const VideoSelectDropdown: React.FC<{
  flavors: Flavor[],
  changeFlavorcallback: React.Dispatch<React.SetStateAction<Flavor | undefined>>,
  defaultFlavor: Flavor;
}> = ({
  flavors,
  changeFlavorcallback,
  defaultFlavor,
}) => {

  const { t } = useTranslation();
  const theme = useTheme();

  const dropdownName = "flavors";

  // Turn flavor into string
  const stringifyFlavor = (flavor: Flavor) => {
    return flavor.type + "/" + flavor.subtype;
  };

  const getFlavorLabel = (flavor: Flavor) => {
    // Omit subtype if all flavour subtypes are equal
    if (flavors.every(f => f.subtype === flavors[0].subtype)) {
      return flavor.type;
    }

    return stringifyFlavor(flavor);
  };

  // Data to populate the dropdown with
  const data = flavors.map(flavor => ({
    label: getFlavorLabel(flavor),
    value: stringifyFlavor(flavor),
  }));

  const subtitleAddFormStyle = css({
    width: "100%",
  });

  return (
    <>
      <div>{t("subtitleVideoArea.selectVideoLabel")}</div>
      <Select
        name={dropdownName}
        styles={selectFieldStyle(theme)}
        isMulti={false}
        css={subtitleAddFormStyle}
        options={data}
        defaultValue={data.filter(({ value }) => value === stringifyFlavor(defaultFlavor))}
        onChange={
          newValue => {
            if (newValue) {
              // Put flavor back together
              const [type, subtype] = newValue.value.split("/");
              const newFlavor: Flavor = { type, subtype };
              changeFlavorcallback(newFlavor);
            }
          }
        }
      />
    </>
  );
};

export default SubtitleVideoArea;
