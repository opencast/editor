import React, { useRef } from "react";

import { css } from "@emotion/react";
import { LuCheck, LuCircleAlert, LuMonitorUp, LuSave } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { ModalHandle, ProtoButton, Spinner } from "@opencast/appkit";

import { useAppSelector } from "../redux/store";
import { selectError, selectStatus } from "../redux/workflowPostSlice";
import { actionButtonStyle, BREAKPOINTS, TOP_BAR_HEIGHT, undisplay } from "../cssStyles";
import { useTheme } from "../themes";
import { useHasUnsavedChanges, useSaveChanges } from "../util/useSaveChanges";
import { ThemedTooltip } from "./Tooltip";
import PublishModal from "./PublishModal";

/**
 * Sticky bar with the actions that apply to the whole editor: saving and publishing
 */
const ActionBar: React.FC = () => {

  const { t } = useTranslation();
  const theme = useTheme();

  const publishModalRef = useRef<ModalHandle>(null);

  const barStyle = css({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "12px",
    boxSizing: "border-box",
    height: `${TOP_BAR_HEIGHT}px`,
    padding: "0 20px",
    background: `${theme.menu_background}`,
    borderBottom: `${theme.menuBorder}`,
  });

  return (
    <div css={barStyle} role="region" aria-label={t("actionBar.tooltip-aria")}>
      <SaveStatus />
      <SaveDraftButton />
      <PublishButton modalRef={publishModalRef} />
      <PublishModal modalRef={publishModalRef} />
    </div>
  );
};

/**
 * Tells the user whether the last save worked
 */
const SaveStatus: React.FC = () => {

  const { t } = useTranslation();
  const theme = useTheme();

  const status = useAppSelector(selectStatus);
  const error = useAppSelector(selectError);
  const hasChanges = useHasUnsavedChanges();

  const statusStyle = css({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    minWidth: 0,
    fontSize: "14px",
    "& > svg": {
      flexShrink: 0,
      fontSize: "18px",
    },
  });

  // Saved changes are no longer saved when the user changes something again
  if (status === "success" && !hasChanges) {
    return (
      <div css={statusStyle} role="status">
        <LuCheck />
        <span>{t("actionBar.saved-text")}</span>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div css={[statusStyle, { color: theme.error }]} role="alert">
        <LuCircleAlert />
        <span>{error ?? t("various.error-text")}</span>
      </div>
    );
  }

  return <div css={statusStyle} />;
};

const SaveDraftButton: React.FC = () => {

  const { t } = useTranslation();
  const theme = useTheme();

  const save = useSaveChanges();
  const isSaving = useAppSelector(selectStatus) === "loading";
  const hasChanges = useHasUnsavedChanges();
  const disabled = isSaving || !hasChanges;
  const tooltip = hasChanges ? t("actionBar.save-tooltip") : t("actionBar.save-nothing-tooltip");

  return (
    <ThemedTooltip title={tooltip}>
      <ProtoButton
        aria-label={tooltip}
        aria-disabled={disabled}
        onClick={() => !disabled && save()}
        css={actionButtonStyle(theme)}
      >
        {isSaving ? <Spinner size={20} /> : <LuSave />}
        <span css={undisplay(BREAKPOINTS.small)}>{t("actionBar.save-button")}</span>
      </ProtoButton>
    </ThemedTooltip>
  );
};

const PublishButton: React.FC<{
  modalRef: React.RefObject<ModalHandle | null>,
}> = ({ modalRef }) => {

  const { t } = useTranslation();
  const theme = useTheme();

  const isSaving = useAppSelector(selectStatus) === "loading";

  return (
    <ThemedTooltip title={t("actionBar.publish-tooltip")}>
      <ProtoButton
        aria-label={t("actionBar.publish-tooltip")}
        aria-disabled={isSaving}
        onClick={() => !isSaving && modalRef.current?.open()}
        css={actionButtonStyle(theme, true)}
      >
        <LuMonitorUp />
        <span css={undisplay(BREAKPOINTS.small)}>{t("actionBar.publish-button")}</span>
      </ProtoButton>
    </ThemedTooltip>
  );
};

export default ActionBar;
