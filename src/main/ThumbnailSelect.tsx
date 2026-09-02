import { css, SerializedStyles } from "@emotion/react";
import { IconType } from "react-icons";
import { LuCamera, LuCopy, LuCircleX, LuUpload } from "react-icons/lu";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../redux/store";
import {
  basicButtonStyle, deactivatedButtonStyle,
  backgroundBoxStyle,
} from "../cssStyles";
import { Theme, useTheme } from "../themes";
import {
  selectOriginalThumbnails,
  selectVideos,
  selectTracks,
  setHasChanges,
  setThumbnail,
  setThumbnails,
  setThumbnailTime,
} from "../redux/videoSlice";
import { Track } from "../types";
import { ThemedTooltip } from "./Tooltip";
import { ProtoButton } from "@opencast/appkit";
import { setIndex, setIsDisplayEditView } from "../redux/thumbnailSlice";
import ReactPlayer from "react-player";

/**
 * Choose between various thumbnail actions for the available tracks.
 */
const ThumbnailSelect: React.FC = () => {

  const videoTracks = useAppSelector(selectVideos);

  const thumbnailSelectStyle = css({
    display: "flex",
    width: "100%",
    height: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "60px",
  });

  return (
    <div css={thumbnailSelectStyle}>
      {videoTracks.map((track: Track, index: number) => (
        <ThumbnailSelector
          key={index}
          track={track}
          trackIndex={index}
        />
      ))}
    </div>
  );
};

/**
 * Component for a single track
 */
const ThumbnailSelector: React.FC<{
  track: Track,
  trackIndex: number,
}> = ({ track, trackIndex }) => {

  const { t } = useTranslation();
  const theme = useTheme();

  const renderPriority = (thumbnailPriority: number) => {
    if (isNaN(thumbnailPriority)) {
      return "";
    } else if (thumbnailPriority === 0) {
      return " - " + t("thumbnail.primary");
    } else if (thumbnailPriority === 1) {
      return " - " + t("thumbnail.secondary");
    } else if (thumbnailPriority < 0) {
      return "";
    } else {
      return " - " + thumbnailPriority;
    }
  };

  const thumbnailSelectorStyle = (maxWidth: number) => css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    maxWidth: `${maxWidth}px`,
    padding: "14px 20px",
    gap: "0px",
  });

  return (
    <div key={trackIndex} css={[backgroundBoxStyle(theme), thumbnailSelectorStyle(540)]}>
      <div css={thumbnailTableRowTitleStyle}>
        {track.flavor.type + renderPriority(track.thumbnailPriority)}
      </div>
      <ThumbnailDisplayer track={track} />
      <ThumbnailButtons
        track={track}
        trackIndex={trackIndex}
      />
      <WorkaroundThumbnailGenerator track={track} />
    </div>
  );
};

/**
 * Displays thumbnail associated with the given track
 * or a placeholder
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
 * Buttons and actions related to thumbnails for a given track
 */
const ThumbnailButtons: React.FC<{
  track: Track,
  trackIndex: number,
}> = ({ track, trackIndex }) => {

  const tracks = useAppSelector(selectTracks);

  const thumbnailButtonsStyle = css({
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
    width: "100%",
    maxWidth: "457px",
  });

  return (
    <div css={thumbnailButtonsStyle}>
      <UploadButton
        track={track}
        index={0}
      />
      <ToGenerationButton
        trackIndex={trackIndex}
        index={1}
      />
      <DiscardButton
        track={track}
        index={2}
      />
      {tracks.length > 1 &&
        <UseForAllTracksButton
          track={track}
          index={3}
        />
      }
    </div>
  );
};

/**
 * Button for switching to generation view
 */
const ToGenerationButton: React.FC<{
  trackIndex: number,
  index: number,
}> = ({ trackIndex, index }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // Switch views
  const switchToGeneration = (index: number) => {
    dispatch(setIsDisplayEditView(true));
    dispatch(setIndex(index));
  };

  return (
    <ThumbnailButton
      handler={() => { switchToGeneration(trackIndex); }}
      text={t("thumbnail.buttonGenerate")}
      tooltipText={t("thumbnail.buttonGenerate-tooltip")}
      ariaLabel={t("thumbnail.buttonGenerate-tooltip-aria")}
      Icon={LuCamera}
      active={true}
      index={index}
    />
  );
};

/**
 * Button for uploading a thumbnail
 */
export const UploadButton: React.FC<{
  track: Track,
  index: number,
  overwriteCSS?: SerializedStyles
}> = ({ track, index, overwriteCSS }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // Upload Refs
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Trigger file handler for upload input element
  const upload = (index: number) => {
    // open file input box on click of other element
    const ref = inputRefs.current[index];
    if (ref !== null) {
      ref.click();
    }
  };

  // Save uploaded file in redux
  const uploadCallback = (event: React.ChangeEvent<HTMLInputElement>, track: Track) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) {
      return;
    }

    // Check if image
    if (fileObj.type.split("/")[0] !== "image") {
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      // the result image data
      if (e.target && e.target.result) {
        const uri = e.target.result as string; // We know this must be string because we use "readAsDataURL"
        dispatch(setThumbnail({ id: track.id, uri: uri }));
        dispatch(setThumbnailTime({ id: track.id, time: undefined }));
        dispatch(setHasChanges(true));
      }
    };
    reader.readAsDataURL(fileObj);
  };

  return (
    <>
      <ThumbnailButton
        handler={() => { upload(index); }}
        text={t("thumbnail.buttonUpload")}
        tooltipText={t("thumbnail.buttonUpload-tooltip")}
        ariaLabel={t("thumbnail.buttonUpload-tooltip-aria")}
        Icon={LuUpload}
        active={true}
        index={0}
        overwriteCSS={overwriteCSS}
      />
      {/* Hidden input field for upload */}
      <input
        style={{ display: "none" }}
        ref={el => {
          inputRefs.current[index] = el;
        }}
        type="file"
        accept="image/*"
        onChange={event => uploadCallback(event, track)}
        aria-hidden="true"
      />
    </>
  );
};

/**
 * Button for undoing any changes made
 */
export const DiscardButton: React.FC<{
  track: Track,
  index: number,
  overwriteCSS?: SerializedStyles
}> = ({ track, index, overwriteCSS }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const originalThumbnails = useAppSelector(selectOriginalThumbnails);

  const originalThumbnail = originalThumbnails.find(e => e.id === track.id);
  const active = (track.thumbnailUri && track.thumbnailUri.startsWith("data") && !track.thumbnailTime)
    || (track.thumbnailTime && originalThumbnail && track.thumbnailTime != originalThumbnail.time);

  const discardThumbnail = (id: string) => {
    dispatch(setThumbnail({ id: id, uri: originalThumbnail?.uri }));
    dispatch(setThumbnailTime({ id: id, time: originalThumbnail?.time }));
  };

  return (
    <ThumbnailButton
      handler={() => { discardThumbnail(track.id); }}
      text={t("thumbnail.buttonDiscard")}
      tooltipText={t("thumbnail.buttonDiscard-tooltip")}
      ariaLabel={t("thumbnail.buttonDiscard-tooltip-aria")}
      Icon={LuCircleX}
      active={(active ? true : false)}
      index={index}
      overwriteCSS={overwriteCSS}
    />
  );
};

/**
 * Button that sets this thumbnail for all tracks
 */
export const UseForAllTracksButton: React.FC<{
  track: Track,
  index: number,
}> = ({ track, index }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const tracks = useAppSelector(selectTracks);

  // Set the given thumbnail for all tracks
  const setForOtherThumbnails = ({ uri, time }: {
    uri: string | undefined,
    time?: { time: string; flavorType: string }
  }) => {
    const thumbnails = [];
    for (const track of tracks) {
      thumbnails.push({ id: track.id, uri, time });
    }
    dispatch(setThumbnails(thumbnails));
    dispatch(setHasChanges(true));
  };

  return (
    <ThumbnailButton
      handler={() => { setForOtherThumbnails({ uri: track.thumbnailUri, time: track.thumbnailTime }); }}
      text={t("thumbnail.buttonUseForOtherThumbnails")}
      tooltipText={t("thumbnail.buttonUseForOtherThumbnails-tooltip")}
      ariaLabel={t("thumbnail.buttonUseForOtherThumbnails-tooltip-aria")}
      Icon={LuCopy}
      active={(track.thumbnailUri && track.thumbnailUri.startsWith("data") ? true : false)}
      index={index}
    />
  );
};

/**
 * Base for the various thumbnail buttons
 */
export const ThumbnailButton: React.FC<{
  handler: () => void,
  text: string;
  tooltipText: string,
  ariaLabel: string,
  Icon: IconType,
  index: number,
  active: boolean,
  overwriteCSS?: SerializedStyles
}> = ({ handler, text, tooltipText, ariaLabel, Icon, active, index, overwriteCSS }) => {
  const theme = useTheme();
  const ref = React.useRef<HTMLButtonElement>(null);

  const clickHandler = () => {
    if (active) { handler(); }
    ref.current?.blur();
  };
  const keyHandler = (event: React.KeyboardEvent) => {
    if (active && (event.key === " " || event.key === "Enter")) {
      handler();
    }
  };

  const thumbnailButtonStyle = (active: boolean, theme: Theme, index: number) => css([
    active ? basicButtonStyle(theme) : deactivatedButtonStyle,
    {
      width: "100%",
      minHeight: "60px",
      height: "100%",
      background: `${theme.element_bg}`,
      padding: "10px 20px",
      fontSize: "20px",
      fontWeight: "bold",

      position: "relative",
      /* Vertical line (after 1st & 3rd items) */
      ...(index === 0 || index === 2
        ? {
          "&::after": {
            content: '""',
            position: "absolute",
            top: "10%",
            bottom: "10%",
            right: 0,
            width: "1px",
            backgroundColor: "#DDD",
            pointerEvents: "none",
          },
        }
        : {}),
      /* Horizontal line (below 1st & 2nd items) */
      ...(index === 0 || index === 1
        ? {
          "&::before": {
            content: '""',
            position: "absolute",
            left: "10%",
            right: "10%",
            bottom: 0,
            height: "1px",
            backgroundColor: "#DDD",
            pointerEvents: "none",
          },
        }
        : {}),
    },
  ]);

  return (
    <ThemedTooltip title={tooltipText}>
      <ProtoButton
        {...{ ref }}
        aria-label={ariaLabel}
        onClick={clickHandler}
        onKeyDown={keyHandler}
        css={overwriteCSS ?? thumbnailButtonStyle(active, theme, index)}
      >
        <Icon />
        {text}
      </ProtoButton>
    </ThemedTooltip>
  );
};

/**
 * Generates a temporary thumbnail from a timestamp
 *
 * Workaround for the backend being unable to send us thumbnails from
 * publications. This way, we can at least show a thumbnail to a user
 * if they previously generated one via timestamp.
 */
const WorkaroundThumbnailGenerator: React.FC<{
  track: Track,
}> = ({ track }) => {
  const dispatch = useAppDispatch();

  const tracks = useAppSelector(selectTracks);
  const thumbnailTime = track.thumbnailTime;
  const thumbnailTrack = thumbnailTime
    ? tracks.find(t => t.flavor.type === thumbnailTime.flavorType)
    : undefined;

  const ref = useRef<ReactPlayer>(null);
  const [ready, setReady] = useState(false);
  const [seeked, setSeeked] = useState(false);

  useEffect(() => {
    if (ref.current && ready && track && track.thumbnailTime && !track.thumbnailUri) {
      ref.current.seekTo(parseFloat(track.thumbnailTime.time), "seconds");
    }
  }, [dispatch, ready, track]);

  useEffect(() => {
    if (ref.current && ready && track && track.thumbnailTime && !track.thumbnailUri
      && seeked) {
      const videoElement = ref.current?.getInternalPlayer() as HTMLVideoElement;
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const canvasContext = canvas.getContext("2d");
      if (canvasContext !== null) {
        canvasContext.drawImage(videoElement, 0, 0);
        const uri = canvas.toDataURL("image/png");

        if (uri) {
          dispatch(setThumbnail({ id: track.id, uri: uri }));
        }
      }
    }
  }, [dispatch, ready, seeked, track]);

  const playerStyle = css({
    display: "none",
  });

  if (!thumbnailTrack) {
    return null;
  }

  return (
    <ReactPlayer url={thumbnailTrack.uri}
      css={playerStyle}
      ref={ref}
      width="unset"
      height="100%"
      playing={false}
      onReady={() => setReady(true)}
      onSeek={() => setSeeked(true)}
    />
  );
};

/**
 * Shared CSS
 */
export const thumbnailTableRowTitleStyle = css({
  textAlign: "center",
  fontSize: "larger",
  fontWeight: "bold",
  "&:first-letter": {
    textTransform: "capitalize",
  },
  paddingBottom: "14px",
});



export default ThumbnailSelect;
