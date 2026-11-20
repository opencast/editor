import React, { useEffect } from "react";

import { css } from "@emotion/react";
import { LuMonitorUp } from "react-icons/lu";
import { Trans, useTranslation } from "react-i18next";
import { FormControlLabel, Radio, RadioGroup } from "@mui/material";
import { ErrorBox, Modal, ModalHandle, ProtoButton, Spinner } from "@opencast/appkit";

import { useAppDispatch, useAppSelector } from "../redux/store";
import { selectSelectedWorkflowId, selectWorkflows, setSelectedWorkflowIndex } from "../redux/videoSlice";
import { selectError, selectStatus } from "../redux/workflowPostSlice";
import { actionButtonStyle } from "../cssStyles";
import { useTheme } from "../themes";
import { useSaveChanges } from "../util/useSaveChanges";
import { Workflow } from "../types";

/**
 * A modal for starting the processing of the video. Lets the user select a workflow, if there is more than one.
 */
const PublishModal: React.FC<{
  modalRef: React.RefObject<ModalHandle | null>,
}> = ({ modalRef }) => {

  const { t } = useTranslation();

  const isSaving = useAppSelector(selectStatus) === "loading";

  return (
    <Modal
      ref={modalRef}
      title={t("actionBar.publish-title")}
      text={{ close: t("modal.close") }}
      // Do not leave the user guessing whether the request went through
      closable={!isSaving}
    >
      <PublishContent modalRef={modalRef} />
    </Modal>
  );
};

const PublishContent: React.FC<{
  modalRef: React.RefObject<ModalHandle | null>,
}> = ({ modalRef }) => {

  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const save = useSaveChanges();
  const status = useAppSelector(selectStatus);
  const error = useAppSelector(selectError);
  const isSaving = status === "loading";

  // Need to make copy to handle undefined displayOrder values
  const workflows = [...useAppSelector(selectWorkflows)].sort((a, b) => b.displayOrder - a.displayOrder);
  const selectedWorkflowId = useAppSelector(selectSelectedWorkflowId);

  useEffect(() => {
    if (workflows.length >= 1) {
      dispatch(setSelectedWorkflowIndex(workflows[0].id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, workflows.length]);

  const contentStyle = css({
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxWidth: "500px",
  });

  const buttonsStyle = css({
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  });

  const text = () => {
    if (workflows.length <= 0) {
      return (
        <Trans i18nKey="workflowSelection.noWorkflows-text">
          There are no workflows to process your changes with.<br />
          Please save your changes and contact an administrator.
        </Trans>
      );
    } else if (workflows.length === 1) {
      return (
        <Trans i18nKey="workflowSelection.oneWorkflow-text">
          The changes will be saved and the video will be cut and processed with
          the workflow {{ workflow: workflows[0].name }}.<br />
          This will take some time.
        </Trans>
      );
    } else {
      return t("workflowSelection.manyWorkflows-text");
    }
  };

  return (
    <div css={contentStyle}>
      <div>{text()}</div>
      {workflows.length > 1 &&
        <RadioGroup
          css={{ gap: "12px" }}
          defaultValue={workflows[0].id}
          name="Workflow Selection Area"
          onChange={event => dispatch(setSelectedWorkflowIndex(event.target.value))}
        >
          {workflows.map((workflow: Workflow) => (
            <WorkflowOption key={workflow.id} workflow={workflow} />
          ))}
        </RadioGroup>
      }
      {status === "failed" &&
        <ErrorBox>
          <span css={{ whiteSpace: "pre-line" }}>
            {t("various.error-text") + "\n"}
            {error ? t("various.error-details-text", { errorMessage: error }) : undefined}
          </span>
        </ErrorBox>
      }
      <div css={buttonsStyle}>
        <ProtoButton
          aria-disabled={isSaving}
          onClick={() => !isSaving && modalRef.current?.close?.()}
          css={actionButtonStyle(theme)}
        >
          {t("modal.cancel")}
        </ProtoButton>
        {workflows.length > 0 &&
          <ProtoButton
            aria-disabled={isSaving}
            onClick={() => !isSaving && selectedWorkflowId && save(selectedWorkflowId)}
            css={actionButtonStyle(theme, true)}
          >
            {isSaving ? <Spinner size={20} /> : <LuMonitorUp />}
            <span>{t("actionBar.publish-button")}</span>
          </ProtoButton>
        }
      </div>
    </div>
  );
};

const WorkflowOption: React.FC<{ workflow: Workflow }> = ({ workflow }) => {

  const theme = useTheme();

  return (
    <FormControlLabel
      value={workflow.id}
      control={<Radio color="default" css={{ alignSelf: "start", color: theme.text }} />}
      label={
        <div css={{ paddingTop: "2px" }}>
          <div css={{ padding: "5px 0px", fontSize: "larger" }}>{workflow.name}</div>
          <div>{workflow.description}</div>
        </div>
      }
    />
  );
};

export default PublishModal;
