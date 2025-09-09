import React, { useEffect } from "react";

import { css } from "@emotion/react";
import { backOrContinueStyle } from "../cssStyles";

import { useAppDispatch, useAppSelector } from "../redux/store";
import { selectWorkflows, setSelectedWorkflowIndex } from "../redux/videoSlice";

import { PageButton } from "./Finish";
import { LuChevronLeft } from "react-icons/lu";
import { selectStatus as saveSelectStatus, selectError as saveSelectError } from "../redux/workflowPostSlice";
import { httpRequestState, Workflow } from "../types";
import { SaveButton } from "./Save";
import { EmotionJSX } from "@emotion/react/dist/declarations/src/jsx-namespace";

import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";
import { FormControlLabel, Radio, RadioGroup } from "@mui/material";
import { useTheme } from "../themes";
import { ErrorBox } from "@opencast/appkit";

/**
 * Allows the user to select a workflow
 */
const WorkflowSelection: React.FC = () => {

  const { t } = useTranslation();

  const dispatch = useAppDispatch();

  // Initialite redux states
  let workflows = useAppSelector(selectWorkflows);
  // Need to make copy to handle undefined displayOrder values
  workflows = [...workflows].sort((a, b) => {
    return (b.displayOrder - a.displayOrder);
  });

  const saveStatus = useAppSelector(saveSelectStatus);
  const saveError = useAppSelector(saveSelectError);

  const workflowSelectionStyle = css({
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "30px",
  });

  const workflowSelectionSelectionStyle = css({
    display: "flex",
    flexDirection: "column",
    alignItems: "left",
    gap: "20px",
    flexWrap: "wrap",
    maxHeight: "50vh",
  });

  useEffect(() => {
    if (workflows.length >= 1) {
      dispatch(setSelectedWorkflowIndex(workflows[0].id));
    }
  }, [dispatch, workflows]);

  const handleWorkflowSelectChange = (event: { target: { value: string; }; }) => {
    dispatch(setSelectedWorkflowIndex(event.target.value));
  };

  // Layout template
  const render = (topTitle: string, topText: JSX.Element, hasWorkflowButtons: boolean,
    nextButton: EmotionJSX.Element, errorStatus: httpRequestState["status"],
    errorMessage: httpRequestState["error"]) => {
    return (
      <div css={workflowSelectionStyle}>
        <h2>{topTitle}</h2>
        {topText}
        {hasWorkflowButtons &&
          <RadioGroup
            css={workflowSelectionSelectionStyle}
            defaultValue={workflows[0].id}
            name="Workflow Selection Area"
            onChange={handleWorkflowSelectChange}
          >
            {workflows.map((workflow: Workflow, _index: number) => (
              <WorkflowButton
                key={workflow.id}
                stateName={workflow.name}
                workflowId={workflow.id}
                workflowDescription={workflow.description}
              />
            ))}
          </RadioGroup>
        }
        <div css={backOrContinueStyle}>
          <PageButton pageNumber={0} label={t("workflowSelection.back-button")} Icon={LuChevronLeft} />
          {/* <PageButton pageNumber={2} label="Continue" iconName={faChevronRight}/> */}
          {nextButton}
        </div>
        {errorStatus === "failed" &&
          <ErrorBox>
            <span>{t("various.error-text")}</span><br />
            {errorMessage ?
              t("various.error-details-text", { errorMessage: saveError }) :
              t("various.error-text")}<br />
          </ErrorBox>
        }
      </div>
    );
  };

  // Fills the layout template with values based on how many workflows are available
  const renderSelection = () => {
    if (workflows.length <= 0) {
      return (
        render(
          t("workflowSelection.saveAndProcess-text"),
          <Trans i18nKey="workflowSelection.noWorkflows-text">
            There are no workflows to process your changes with.<br />
            Please save your changes and contact an administrator.
          </Trans>,
          false,
          <SaveButton />,
          saveStatus,
          saveError,
        )
      );
    } else if (workflows.length === 1) {
      return (
        render(
          t("workflowSelection.saveAndProcess-text"),
          <Trans i18nKey="workflowSelection.oneWorkflow-text">
            The changes will be saved and the video will be cut and processed with
            the workflow {{ workflow: workflows[0].name }}.<br />
            This will take some time.
          </Trans>,
          false,
          <SaveButton
            isTransitionToEnd={true}
            text={t("workflowSelection.startProcessing-button")}
          />,
          saveStatus,
          saveError,
        )
      );
    } else {
      return (
        render(
          t("workflowSelection.selectWF-text"),
          <div>
            {t("workflowSelection.manyWorkflows-text")}
          </div>,
          true,
          <SaveButton
            isTransitionToEnd={true}
            text={t("workflowSelection.startProcessing-button")}
          />,
          saveStatus,
          saveError,
        )
      );
    }
  };

  return (
    renderSelection()
  );
};

const WorkflowButton: React.FC<{
  stateName: string,
  workflowId: string,
  workflowDescription: string;
}> = ({
  stateName,
  workflowId,
  workflowDescription,
}) => {

  // Note: Styling the Radio Button is done in WorkflowSelectRadio

  const labelStyle = css({
    display: "flex",
    flexDirection: "column",
    maxWidth: "500px",
    paddingTop: "2px",
  });

  const headerStyle = css({
    width: "100%",
    padding: "5px 0px",
    fontSize: "larger",
  });

  return (
    <FormControlLabel value={workflowId} control={<WorkflowSelectRadio />}
      label={
        <div css={labelStyle}>
          <div css={headerStyle}>{stateName}</div>
          <div>{workflowDescription}</div>
        </div>
      }
    />
  );
};

const WorkflowSelectRadio: React.FC = props => {

  const theme = useTheme();

  const style = css({
    alignSelf: "start",
    color: `${theme.text}`,
    "&$checked": {
      color: `${theme.text}`,
    },
  });

  return (
    <Radio
      color="default"
      css={style}
      {...props}
    />
  );
};


export default WorkflowSelection;
