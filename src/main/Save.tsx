import React, { useEffect } from "react";

import { css } from "@emotion/react";
import {
  basicButtonStyle, backOrContinueStyle, ariaLive,
  navigationButtonStyle,
} from "../cssStyles";

import { LuCircleCheck, LuCircleAlert, LuChevronLeft, LuSave, LuCheck } from "react-icons/lu";

import { useAppDispatch, useAppSelector } from "../redux/store";
import {
  selectHasChanges,
  selectSegments,
  selectSelectedWorkflowId,
  selectTracks,
  setHasChanges as videoSetHasChanges,
} from "../redux/videoSlice";
import { postVideoInformation, selectStatus, selectError } from "../redux/workflowPostSlice";

import { CallbackButton, PageButton } from "./Finish";

import { useTranslation } from "react-i18next";
import {
  setHasChanges as metadataSetHasChanges,
  selectHasChanges as metadataSelectHasChanges,
  selectCatalogs,
} from "../redux/metadataSlice";
import {
  selectSubtitles, selectHasChanges as selectSubtitleHasChanges,
  setHasChanges as subtitleSetHasChanges,
} from "../redux/subtitleSlice";
import { serializeSubtitle } from "../util/utilityFunctions";
import { useTheme } from "../themes";
import { ThemedTooltip } from "./Tooltip";
import { ErrorBox } from "@opencast/appkit";
import { Spinner } from "@opencast/appkit";
import { ProtoButton } from "@opencast/appkit";
import { setEnd } from "../redux/endSlice";

/**
 * Shown if the user wishes to save.
 * Informs the user about saving and displays a save button
 */
const Save: React.FC = () => {

  const { t } = useTranslation();

  const postWorkflowStatus = useAppSelector(selectStatus);
  const postError = useAppSelector(selectError);
  const metadataHasChanges = useAppSelector(metadataSelectHasChanges);
  const hasChanges = useAppSelector(selectHasChanges);
  const subtitleHasChanges = useAppSelector(selectSubtitleHasChanges);

  const saveStyle = css({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "30px",
  });

  const render = () => {
    // Post (successful) save
    if (postWorkflowStatus === "success"
      && !hasChanges && !metadataHasChanges && !subtitleHasChanges) {
      return (
        <>
          <LuCircleCheck css={{ fontSize: 80 }} />
          <div>{t("save.success-text")}</div>
          <CallbackButton />
        </>
      );
      // Pre save
    } else {
      return (
        <>
          <span css={{ maxWidth: "500px" }}>
            {t("save.info-text")}
          </span>
          <div css={backOrContinueStyle}>
            <PageButton pageNumber={0} label={t("various.goBack-button")} Icon={LuChevronLeft} />
            <SaveButton />
          </div>
        </>
      );
    }
  };

  return (
    <div css={saveStyle}>
      <h1>{t("save.headline-text")}</h1>
      {render()}
      {postWorkflowStatus === "failed" &&
        <ErrorBox>
          <span css={{ whiteSpace: "pre-line" }}>
            {t("various.error-text") + "\n"}
            {postError ?
              t("various.error-details-text", { errorMessage: postError }) : undefined
            }
          </span>
        </ErrorBox>
      }
    </div>
  );
};

/**
 * Button that sends a post request to save current changes
 */
export const SaveButton: React.FC<{
  text?: string
  isTransitionToEnd?: boolean
}> = ({
  text,
  isTransitionToEnd = false,
}) => {
  const { t } = useTranslation();

  // Initialize redux variables
  const dispatch = useAppDispatch();

  const segments = useAppSelector(selectSegments);
  const tracks = useAppSelector(selectTracks);
  const subtitles = useAppSelector(selectSubtitles);
  const metadata = useAppSelector(selectCatalogs);
  const selectedWorkflowId = useAppSelector(selectSelectedWorkflowId);
  const workflowStatus = useAppSelector(selectStatus);
  const theme = useTheme();

  // Update based on current fetching status
  let tooltip = null;
  const Icon = () => {
    if (workflowStatus === "failed") {
      tooltip = t("save.confirmButton-failed-tooltip");
      return <LuCircleAlert />;
    } else if (workflowStatus === "success") {
      tooltip = t("save.confirmButton-success-tooltip");
      return <LuCheck />;
    } else if (workflowStatus === "loading") {
      tooltip = t("save.confirmButton-attempting-tooltip");
      return <Spinner />;
    }
    <LuSave />;
  };

  const ariaSaveUpdate = () => {
    if (workflowStatus === "success") {
      return t("save.success-tooltip-aria");
    }
  };

  const prepareSubtitles = () =>
    Object.entries(subtitles).map(([id, { deleted, cues, tags }]) => ({
      id,
      subtitle: deleted ? "" : serializeSubtitle(cues),
      tags: deleted ? [] : tags,
      deleted,
    }));

  const save = () => {
    dispatch(postVideoInformation({
      segments: segments,
      tracks: tracks,
      subtitles: prepareSubtitles(),
      metadata: metadata,
      workflow: selectedWorkflowId ? [{ id: selectedWorkflowId }] : undefined,
    }));
  };

  // Let users leave the page without warning after a successful save
  useEffect(() => {
    if (workflowStatus === "success") {
      if (isTransitionToEnd) {
        dispatch(setEnd({ hasEnded: true, value: "success" }));
      }
      dispatch(videoSetHasChanges(false));
      dispatch(metadataSetHasChanges(false));
      dispatch(subtitleSetHasChanges(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, workflowStatus]);

  return (
    <ThemedTooltip title={tooltip == null ? tooltip = "" : tooltip}>
      <ProtoButton
        onClick={save}
        css={[basicButtonStyle(theme), navigationButtonStyle(theme)]}
      >
        {Icon()}
        <span>{text ?? t("save.confirm-button")}</span>
        <div css={ariaLive} aria-live="polite" aria-atomic="true">{ariaSaveUpdate()}</div>
      </ProtoButton>
    </ThemedTooltip>
  );
};

export default Save;
