import React, { useState, useRef, useEffect, useImperativeHandle, JSX } from "react";

import { css, SerializedStyles } from "@emotion/react";

import { AppDispatch, useAppDispatch, useAppSelector } from "../redux/store";
import {
  selectIsPlaying,
  selectCurrentlyAtInSeconds,
  setIsPlaying,
  selectIsMuted,
  selectVolume,
  selectVideoCount,
  selectDurationInSeconds,
  setPreviewTriggered,
  selectPreviewTriggered,
  setAspectRatio,
  selectAspectRatio,
  setClickTriggered,
  selectClickTriggered,
  setJumpTriggered,
  selectJumpTriggered,
  setCurrentlyAt,
  selectVideos,
} from "../redux/videoSlice";

import ReactPlayer from "react-player";

import { roundToDecimalPlace } from "../util/utilityFunctions";

import { useTranslation } from "react-i18next";

import { sleep } from "./../util/utilityFunctions";

import { RootState } from "../redux/store";
import { ActionCreatorWithPayload, AsyncThunk } from "@reduxjs/toolkit";

import { useTheme } from "../themes";

import { backgroundBoxStyle } from "../cssStyles";
import { ErrorBox } from "@opencast/appkit";

const VideoPlayers: React.FC<{
  refs?: React.MutableRefObject<(VideoPlayerForwardRef | null)[]>,
  widthInPercent?: number,
  maxHeightInPixel?: number;
}> = ({
  refs,
  widthInPercent = 100,
  maxHeightInPixel = 300,
}) => {

  const videos = useAppSelector(selectVideos);
  let primaryIndex = videos.findIndex(e => e.audio_stream.available === true);
  primaryIndex = primaryIndex < 0 ? 0 : primaryIndex;
  const videoCount = useAppSelector(selectVideoCount);

  const [videoPlayers, setVideoPlayers] = useState<JSX.Element[]>([]);

  const videoPlayerAreaStyle = css({
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    width: widthInPercent + "%",
    borderRadius: "5px",
    gap: "10px",

    maxHeight: maxHeightInPixel + "px",
  });

  // Initialize video players
  useEffect(() => {
    const videoPlayers: JSX.Element[] = [];
    for (let i = 0; i < videoCount; i++) {
      videoPlayers.push(
        <VideoPlayer
          key={i}
          dataKey={i}
          url={videos[i].uri}
          isPrimary={i === primaryIndex}
          subtitleUrl={""}
          first={i === 0}
          last={i === videoCount - 1}
          selectIsPlaying={selectIsPlaying}
          selectIsMuted={selectIsMuted}
          selectVolume={selectVolume}
          selectCurrentlyAtInSeconds={selectCurrentlyAtInSeconds}
          selectPreviewTriggered={selectPreviewTriggered}
          selectClickTriggered={selectClickTriggered}
          selectJumpTriggered={selectJumpTriggered}
          selectAspectRatio={selectAspectRatio}
          setIsPlaying={setIsPlaying}
          setPreviewTriggered={setPreviewTriggered}
          setClickTriggered={setClickTriggered}
          setJumpTriggered={setJumpTriggered}
          setCurrentlyAt={setCurrentlyAt}
          setAspectRatio={setAspectRatio}
          ref={el => {
            if (refs === undefined) { return; }
            (refs.current[i] = el);
          }}
        />,
      );
    }
    setVideoPlayers(videoPlayers);
  }, [primaryIndex, refs, videoCount, videos]);


  return (
    <div css={videoPlayerAreaStyle}>
      {videoPlayers}
    </div>
  );
};

export interface VideoPlayerForwardRef {
  captureVideo: () => string | undefined,
  getWidth: () => number,
  getCurrentTime: () => number,
}

interface VideoPlayerProps {
  dataKey: number,
  url: string | undefined,
  isPrimary: boolean,
  subtitleUrl: string,
  first: boolean,
  last: boolean,
  overwritePlayerCSS?: SerializedStyles,
  selectIsPlaying: (state: RootState) => boolean,
  selectIsMuted: (state: RootState) => boolean,
  selectVolume: (state: RootState) => number,
  selectCurrentlyAtInSeconds: (state: RootState) => number,
  selectPreviewTriggered: (state: RootState) => boolean,
  selectClickTriggered: (state: RootState) => boolean,
  selectJumpTriggered: (state: RootState) => boolean,
  selectAspectRatio: (state: RootState) => number,
  setIsPlaying: ActionCreatorWithPayload<boolean, string>,
  setPreviewTriggered: ActionCreatorWithPayload<boolean, string>,
  setClickTriggered: ActionCreatorWithPayload<boolean, string>,
  setJumpTriggered: ActionCreatorWithPayload<boolean, string>,
  setCurrentlyAt: ActionCreatorWithPayload<number, string> | AsyncThunk<void, number, {
    state: RootState;
    dispatch: AppDispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
  }>,
  setAspectRatio: ActionCreatorWithPayload<{ dataKey: number; } & { width: number, height: number; }, string>,
}

/**
 * A single video player
 * @param {string} url - URL to load video from
 * @param {boolean} isPrimary - If the player is the main control
 */
export const VideoPlayer = React.forwardRef<VideoPlayerForwardRef, VideoPlayerProps>(
  (props, forwardRefThing) => {
    const {
      dataKey,
      url,
      isPrimary,
      selectIsPlaying,
      selectIsMuted,
      selectVolume,
      subtitleUrl,
      first,
      last,
      overwritePlayerCSS,
      selectCurrentlyAtInSeconds,
      selectPreviewTriggered,
      selectClickTriggered,
      selectJumpTriggered,
      selectAspectRatio,
      setIsPlaying,
      setPreviewTriggered,
      setClickTriggered,
      setCurrentlyAt,
      setAspectRatio,
    } = props;

    const { t } = useTranslation();

    // Init redux variables
    const dispatch = useAppDispatch();
    const isPlaying = useAppSelector(selectIsPlaying);
    const isMuted = useAppSelector(selectIsMuted);
    const volume = useAppSelector(selectVolume);
    const currentlyAt = useAppSelector(selectCurrentlyAtInSeconds);
    const duration = useAppSelector(selectDurationInSeconds);
    const previewTriggered = useAppSelector(selectPreviewTriggered);
    const clickTriggered = useAppSelector(selectClickTriggered);
    const jumpTriggered = useAppSelector(selectJumpTriggered);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const aspectRatio = useAppSelector(selectAspectRatio);
    const theme = useTheme();

    // Init state variables
    const ref = useRef<HTMLVideoElement>(null);
    const [ready, setReady] = useState(false);
    const [errorState, setError] = useState(false);
    const [isAspectRatioUpdated, setIsAspectRatioUpdated] = useState(false);

    // Callback for when the video is playing
    const onTimeUpdate = () => {
      const player = ref.current;
      if (!player) { return; }
      if (isPrimary) {
        // Only update redux if there was a substantial change
        if (roundToDecimalPlace(currentlyAt, 3) !== roundToDecimalPlace(player.currentTime, 3) &&
          player.currentTime !== 0 &&
          // Avoid overwriting video restarts
          player.currentTime < duration) {
          dispatch(setCurrentlyAt(player.currentTime * 1000));
        }
      }
    };

    // Tries to get video dimensions from the HTML5 elements until they are not 0,
    // then updates the store
    async function updateAspectRatio() {
      if (ref.current) {
        let w = (ref.current).videoWidth;
        let h = (ref.current).videoHeight;
        while (w === 0 || h === 0) {
          await sleep(100);
          w = (ref.current).videoWidth;
          h = (ref.current).videoHeight;
        }
        dispatch(setAspectRatio({ dataKey, width: w, height: h }));
        setIsAspectRatioUpdated(true);
      }
    }

    // Callback for checking whether the video element is ready
    const onReadyCallback = () => {
      setReady(true);
    };

    const onPlay = () => {
      // Restart the video from the beginning when at the end
      if (isPrimary && currentlyAt >= duration) {
        dispatch(setCurrentlyAt(0));
        // Flip-flop the "isPlaying" switch, or else the video won"t start playing
        dispatch(setIsPlaying(false));
        dispatch(setIsPlaying(true));
      }
    };

    const onEndedCallback = () => {
      if (isPrimary && currentlyAt !== 0) {
        dispatch(setIsPlaying(false));
        // It seems onEnded is called before the full duration is reached, so we set currentlyAt to the very end
        dispatch(setCurrentlyAt(duration * 1000));
      }
    };

    const onErrorCallback: React.ReactEventHandler<HTMLVideoElement> | undefined = _e => {
      setError(true);
    };

    useEffect(() => {
      // Seek if the position in the video got changed externally
      if (!isPlaying && ref.current && ready) {
        ref.current.currentTime = currentlyAt;
      }
      if (previewTriggered && ref.current && ready) {
        ref.current.currentTime = currentlyAt;
        dispatch(setPreviewTriggered(false));
      }
      if (clickTriggered && ref.current && ready) {
        ref.current.currentTime = currentlyAt;
        dispatch(setClickTriggered(false));
      }
      if (jumpTriggered && ref.current && ready) {
        ref.current.currentTime = currentlyAt;
        dispatch(setJumpTriggered(false));
      }
    });

    useEffect(() => {
      if (!isAspectRatioUpdated && ready) {
        // Update the store with video dimensions for rendering purposes
        updateAspectRatio();
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAspectRatioUpdated, ready]);

    // Callback specifically for the subtitle editor view
    // When changing urls while the player is playing, don"t reset to 0
    // (due to onProgressCallback resetting to 0),
    // but keep the current currentlyAt
    useEffect(() => {
      if (ref.current && ready) {
        ref.current.currentTime = currentlyAt;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url]);

    // Trigger a workaround for subtitles not being displayed in the video in Firefox
    useEffect(() => {
      // Only trigger workaround in Firefox, as it will cause issues in Chrome
      /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
      // @ts-ignore
      if (typeof InstallTrigger !== "undefined") {
        reAddTrack();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subtitleUrl]);

    const playerConfig = {
      file: {
        attributes: {
          // Skip player when navigating page with keyboard
          tabIndex: "-1",
          crossOrigin: "anonymous",    // allow thumbnail generation
        },
        tracks: [
          { kind: "subtitles", src: subtitleUrl, srcLang: "en", default: true, label: "I am irrelevant" },
        ],
      },
    };

    /**
     * Workaround for subtitles not appearing in Firefox (or only appearing on inital mount, then disappearing
     * when changed). Removes old tracks and readds them, because letting React to it does not seem
     * to work properly.
     * Fairly hacky, currently only works for a page with only one video
     * https://github.com/CookPete/react-player/issues/490
     */
    function reAddTrack() {
      const video = document.querySelector("video");

      if (video) {
        const oldTracks = video.querySelectorAll("track");
        oldTracks.forEach(oldTrack => {
          video.removeChild(oldTrack);
        });
      }

      if (playerConfig && playerConfig.file && playerConfig.file.tracks) {
        playerConfig.file.tracks.map((t, trackIdx) => {
          const track = document.createElement("track");
          track.kind = t.kind!;
          track.label = t.label!;
          track.srclang = t.srcLang!;
          track.default = t.default!;
          track.src = t.src!;
          track.track.mode = "showing";    // Because the load callback may sometimes not execute properly
          track.addEventListener("error", (_e: Event) => {
            console.warn(`Cannot load track ${t.src}`);
          });
          track.addEventListener("load", (e: Event) => {
            const textTrack = e.currentTarget as HTMLTrackElement;
            if (textTrack) {
              if (t.default === true) {
                textTrack.track.mode = "showing";
                video!.textTracks[trackIdx].mode = "showing"; // thanks Firefox
              } else {
                textTrack.track.mode = "hidden";
                video!.textTracks[trackIdx].mode = "hidden"; // thanks Firefox
              }
            }
          });
          const video = document.querySelector("video");
          if (video) {
            video.appendChild(track);
          }
        });
      }
    }

    // External functions
    useImperativeHandle(forwardRefThing, () => ({
      // Renders the current frame in the video element to a canvas
      // Returns the data url
      captureVideo() {
        if (!ref.current) {
          return;
        }
        const video = ref.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const canvasContext = canvas.getContext("2d");
        if (canvasContext !== null) {
          canvasContext.drawImage(video, 0, 0);
          return canvas.toDataURL("image/png");
        }
      },
      getWidth() {
        return ref.current?.clientWidth ?? 0;
      },
      getCurrentTime() {
        return (ref.current?.getInternalPlayer() as HTMLVideoElement).currentTime;
      },
    }));

    const reactPlayerStyle = css({
      aspectRatio: "16 / 9",    // Hard-coded for now because there are problems with updating this value at runtime

      overflow: "hidden", // Required for borderRadius to show
      ...first && {
        borderTopLeftRadius: "5px",
        borderBottomLeftRadius: "5px",
      },
      ...last && {
        borderTopLeftRadius: "5px",
        borderBottomRightRadius: "5px",
      },
    });

    const videoPlayerWrapperStyles = css({
      height: "100%",
      width: "100%",
      display: "flex",
      flex: "1 1 0",
      minHeight: "0",

      // For single video, center!
      ...(first && last) && { justifyContent: "center" },

      // For multi videos, first from right side, sitting on end
      ...(first && !last) && { justifyContent: "end" },

      // For multi videos, last from right side, sitting on start
      ...(last && !first) && { justifyContent: "start" },

      // For multi videos, in between, fit content and center!
      ...(!first && !last) && { justifyContent: "center", flexBasis: "fit-content" },
    });

    const render = () => {
      if (!errorState) {
        return (
          <div css={videoPlayerWrapperStyles}>
            <ReactPlayer
              src={url}
              wrapper={"div"}
              css={overwritePlayerCSS ?? [backgroundBoxStyle(theme), reactPlayerStyle]}
              ref={ref}
              width="unset"
              height="100%"
              playing={isPlaying}
              volume={volume}
              muted={!isPrimary || isMuted}
              onTimeUpdate={onTimeUpdate}
              onReady={onReadyCallback}
              onPlay={onPlay}
              onEnded={onEndedCallback}
              onError={onErrorCallback}
              // tabindex is currently not properly applied to neither wrapper nor video element
              tabIndex={-1} // Skip player when navigating page with keyboard
              crossOrigin="anonymous" // allow thumbnail generation
              disablePictureInPicture={true}
              // @ts-expect-error: The Config type does match what we need
              config={playerConfig}
            />
          </div>
        );
      } else {
        return (
          <ErrorBox>
            {t("error.loadError-text")}
          </ErrorBox>
        );
      }
    };

    return (
      <>
        {render()}
      </>
    );

    // return (
    //   <div title="Video Player">
    //     <video width="320" height="240" controls ref={vidRef}>
    //     <source src="https://media.geeksforgeeks.org/wp-content/uploads/20190616234019/Canvas.move_.mp4" type="video/mp4" />
    //     Your browser does not support the video tag.
    //     </video>
    //   </div>
    // );
  });

export default VideoPlayers;
