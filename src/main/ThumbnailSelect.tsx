import { css } from "@emotion/react";
import { IconType } from "react-icons";
import { LuCopy, LuCircleX, LuFilm, LuUpload } from "react-icons/lu";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import Select from "react-select";
import { useAppDispatch, useAppSelector } from "../redux/store";
import {
  basicButtonStyle, deactivatedButtonStyle,
  backgroundBoxStyle, BREAKPOINTS, MyOptionType, selectFieldStyle, titleStyle, titleStyleBold, undisplay,
  verticalLineStyle,
} from "../cssStyles";
import { useTheme } from "../themes";
import {
  selectOriginalThumbnails,
  selectTracks,
  setHasChanges,
  setThumbnail,
  setThumbnails,
  setThumbnailTime,
} from "../redux/videoSlice";
import { Track } from "../types";
import { ThemedTooltip } from "./Tooltip";
import { ProtoButton } from "@opencast/appkit";
import { selectGeneratedAt, selectIndex, setIndex, setIsDisplayEditView } from "../redux/thumbnailSlice";
import Notification from "./Notification";
import ReactPlayer from "react-player";

/**
 * Shows the thumbnail of one track, with a dropdown to switch between the tracks.
 */
const ThumbnailSelect: React.FC = () => {

  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const tracks = useAppSelector(selectTracks);
  const index = useAppSelector(selectIndex);

  const track = tracks[index];
  if (track === undefined) {
    return null;
  }

  const selectorStyle = css({
    width: "100%",
    maxWidth: "300px",
    "& > label": {
      display: "block",
      textAlign: "center",
      paddingBottom: "6px",
    },
  });

  const options: MyOptionType[] = tracks.map((track, i) => ({
    label: trackLabel(t, track),
    value: i.toString(),
  }));

  return (
    <div css={thumbnailPageStyle}>
      <div css={[titleStyle(theme), titleStyleBold(theme)]}>{t("thumbnail.title")}</div>
      <GeneratedMessage />
      <div css={[backgroundBoxStyle(theme), thumbnailCardStyle]}>
        <div css={thumbnailTableRowTitleStyle}>
          {t("thumbnail.current-title", { track: track.flavor.type })}
        </div>
        <ThumbnailDisplayer track={track} />
        <ThumbnailButtons
          track={track}
          onGenerate={() => dispatch(setIsDisplayEditView(true))}
          opensGeneration={true}
          generating={false}
          allowUseForAll={tracks.length > 1}
        />
      </div>
      {tracks.length > 1 &&
        <div css={selectorStyle}>
          <label htmlFor="thumbnail-track-select">{t("thumbnail.selectTrack-label")}</label>
          <Select<MyOptionType, false>
            inputId="thumbnail-track-select"
            styles={selectFieldStyle(theme)}
            isSearchable={false}
            options={options}
            value={options[index]}
            onChange={option => {
              if (option) {
                dispatch(setIndex(parseInt(option.value)));
              }
            }}
          />
        </div>
      }
      {tracks.map(track =>
        <WorkaroundThumbnailGenerator key={track.id} track={track} />,
      )}
    </div>
  );
};

const MESSAGE_DURATION = 5000;

/**
 * Tells the user that a thumbnail was just generated
 */
export const GeneratedMessage: React.FC = () => {

  const { t } = useTranslation();

  const generatedAt = useAppSelector(selectGeneratedAt);
  const [visible, setVisible] = useState(false);

  // Hide the message again after a while. Starts over when generating again.
  useEffect(() => {
    if (generatedAt === undefined || Date.now() - generatedAt > MESSAGE_DURATION) {
      return;
    }
    setVisible(true);
    const timeout = setTimeout(() => setVisible(false), MESSAGE_DURATION);
    return () => clearTimeout(timeout);
  }, [generatedAt]);

  const messageStyle = css({
    position: "absolute",
    top: "12px",
    right: "2%",
    zIndex: 1,
  });

  return (
    <div css={messageStyle} role="status">
      {visible && <Notification>{t("thumbnail.generated-text")}</Notification>}
    </div>
  );
};

/**
 * Name of a track, including whether it is the one used as the video preview
 */
const trackLabel = (t: TFunction, track: Track) => {
  const priority = track.thumbnailPriority;
  if (isNaN(priority) || priority < 0) {
    return track.flavor.type;
  } else if (priority === 0) {
    return `${track.flavor.type} - ${t("thumbnail.primary")}`;
  } else if (priority === 1) {
    return `${track.flavor.type} - ${t("thumbnail.secondary")}`;
  }
  return `${track.flavor.type} - ${priority}`;
};

/**
 * Displays thumbnail associated with the given track
 * or a placeholder
 */
export const ThumbnailDisplayer: React.FC<{
  track: Track
}> = ({
  track,
}) => {

  const { t } = useTranslation();
  const theme = useTheme();

  const placeholderStyle = css({
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
          css={thumbnailMediaStyle}
        />
        :
        // Placeholder
        <div css={[thumbnailMediaStyle, placeholderStyle]}>
          <span>{t("thumbnail.noThumbnailAvailable")}</span>
        </div>
      }
    </>
  );
};

/**
 * Buttons and actions related to thumbnails for a given track
 *
 * While a thumbnail is being generated, the buttons that would replace it are deactivated.
 * The generate button either generates right away, or opens the view for it.
 */
export const ThumbnailButtons: React.FC<{
  track: Track,
  onGenerate: () => void,
  opensGeneration: boolean,
  generating: boolean,
  allowUseForAll: boolean,
}> = ({ track, onGenerate, opensGeneration, generating, allowUseForAll }) => {

  const { t } = useTranslation();

  const generateTooltip = opensGeneration
    ? t("thumbnail.buttonGoToGeneration-tooltip")
    : t("thumbnail.buttonGenerate-tooltip");
  const generateAriaLabel = opensGeneration
    ? t("thumbnail.buttonGoToGeneration-tooltip-aria")
    : t("thumbnail.buttonGenerate-tooltip-aria");

  // Always one row. Longer labels wrap inside their button instead.
  const thumbnailButtonsStyle = css({
    display: "flex",
    alignItems: "center",
    width: "100%",
  });

  return (
    <div css={thumbnailButtonsStyle}>
      <UploadButton track={track} disabled={generating} />
      {track.video_stream.available &&
        <>
          <div css={verticalLineStyle} />
          <ThumbnailButton
            handler={onGenerate}
            text={t("thumbnail.buttonGenerate")}
            tooltipText={generateTooltip}
            ariaLabel={generateAriaLabel}
            Icon={LuFilm}
            active={true}
          />
        </>
      }
      <div css={verticalLineStyle} />
      <DiscardButton track={track} disabled={generating} />
      {allowUseForAll &&
        <>
          <div css={verticalLineStyle} />
          <UseForAllTracksButton track={track} disabled={generating} />
        </>
      }
    </div>
  );
};

/**
 * Button for uploading a thumbnail
 */
export const UploadButton: React.FC<{
  track: Track,
  disabled?: boolean,
}> = ({ track, disabled = false }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const inputRef = React.useRef<HTMLInputElement>(null);

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
        // Open the file input box
        handler={() => { inputRef.current?.click(); }}
        text={t("thumbnail.buttonUpload")}
        tooltipText={t("thumbnail.buttonUpload-tooltip")}
        ariaLabel={t("thumbnail.buttonUpload-tooltip-aria")}
        Icon={LuUpload}
        active={!disabled}
      />
      {/* Hidden input field for upload */}
      <input
        style={{ display: "none" }}
        ref={inputRef}
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
  disabled?: boolean,
}> = ({ track, disabled = false }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const originalThumbnails = useAppSelector(selectOriginalThumbnails);

  const originalThumbnail = originalThumbnails.find(e => e.id === track.id);
  const active = !disabled && (
    (track.thumbnailUri && track.thumbnailUri.startsWith("data") && !track.thumbnailTime)
    || (track.thumbnailTime && originalThumbnail && track.thumbnailTime != originalThumbnail.time)
  );

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
    />
  );
};

/**
 * Button that sets this thumbnail for all tracks
 */
export const UseForAllTracksButton: React.FC<{
  track: Track,
  disabled?: boolean,
}> = ({ track, disabled = false }) => {
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
      active={!disabled && (track.thumbnailUri && track.thumbnailUri.startsWith("data") ? true : false)}
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
  active: boolean,
}> = ({ handler, text, tooltipText, ariaLabel, Icon, active }) => {
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

  const thumbnailButtonStyle = css([
    active ? basicButtonStyle(theme) : deactivatedButtonStyle,
    {
      flex: "1 1 auto",
      minWidth: 0,
      minHeight: "60px",
      background: theme.element_bg,
      padding: "10px 12px",
      fontSize: "16px",
      fontWeight: "bold",
      "& > svg": {
        flexShrink: 0,
      },
    },
  ]);

  return (
    <ThemedTooltip title={tooltipText}>
      <ProtoButton
        {...{ ref }}
        aria-label={ariaLabel}
        aria-disabled={!active}
        onClick={clickHandler}
        onKeyDown={keyHandler}
        css={thumbnailButtonStyle}
      >
        <Icon />
        {/* Only the icon is left on small screens. The tooltip and aria label still say what it does. */}
        <span css={undisplay(BREAKPOINTS.medium)}>{text}</span>
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

  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [seeked, setSeeked] = useState(false);

  useEffect(() => {
    if (ref.current && ready && track && track.thumbnailTime && !track.thumbnailUri) {
      ref.current.currentTime = parseFloat(track.thumbnailTime.time);
    }
  }, [dispatch, ready, track]);

  useEffect(() => {
    if (ref.current && ready && track && track.thumbnailTime && !track.thumbnailUri
      && seeked) {
      const videoElement = ref.current as HTMLVideoElement;
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
    // The player sets `display: block` inline, which would otherwise win
    display: "none !important",
  });

  if (!thumbnailTrack) {
    return null;
  }

  return (
    <ReactPlayer src={thumbnailTrack.uri}
      css={playerStyle}
      ref={ref}
      width="unset"
      height="100%"
      playing={false}
      onReady={() => setReady(true)}
      onSeeked={() => setSeeked(true)}
    />
  );
};

/**
 * Shared CSS
 */

// The page, card and media of the overview and the generation view. They share
// these so that the card does not move when switching between the views.
export const thumbnailPageStyle = css({
  position: "relative",
  display: "flex",
  width: "100%",
  flexDirection: "column",
  alignItems: "center",
  gap: "16px",
});

export const thumbnailCardStyle = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "100%",
  maxWidth: "740px",
});

export const thumbnailMediaStyle = css({
  width: "100%",
  maxWidth: "540px",
  aspectRatio: "16 / 9",
});

export const thumbnailTableRowTitleStyle = css({
  textAlign: "center",
  fontSize: "larger",
  fontWeight: "bold",
  paddingBottom: "14px",
});

export default ThumbnailSelect;
