import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../redux/store";
import { useEffect } from "react";
import SubtitleVideoArea from "./SubtitleVideoArea";
import Timeline from "./Timeline";
import { css } from "@emotion/react";
import { useTheme } from "../themes";
import { titleStyle, titleStyleBold } from "../cssStyles";
import {
  dummy,
  selectAspectRatio,
  selectClickTriggered,
  selectCurrentlyAt,
  selectCurrentlyAtInSeconds,
  selectIsPlaying,
  selectIsPlayPreview,
  selectPreviewTriggered,
  selectQuizzesFromOpencast,
  selectTextBoxesFromOpencast,
  setAspectRatio,
  setClickTriggered,
  setCurrentlyAt,
  setIsPlaying,
  setIsPlayPreview,
  setPreviewTriggered,
} from "../redux/videoSlice";
import InteractiveElementsList from "./InteractiveElementsList";
import {
  InteractiveElement,
  Quiz,
  selectInteractiveElements,
  setInteractiveElements,
  Textbox,
} from "../redux/interactiveElementsSlice";
import InteractiveElementsActions from "./InteractiveElementsActions";
import { nanoid } from "@reduxjs/toolkit";

/**
 * Displays an editor view for a selected subtitle file
 */
const InteractiveElements: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const textboxTrack = useAppSelector(state => selectTextBoxesFromOpencast(state));
  const quizTrack = useAppSelector(state => selectQuizzesFromOpencast(state));
  const interactiveElements = useAppSelector(state => selectInteractiveElements(state));

  // Prepare subtitle in redux
  useEffect(() => {
    // Parse subtitle data from Opencast
    if (interactiveElements.length === 0) {
      const parsedElements: InteractiveElement[] = [];
      if (textboxTrack) {
        const textboxes: Textbox[] = JSON.parse(textboxTrack.elementsJSON) as Textbox[];
        for (const textbox of textboxes) {
          parsedElements.push({
            ...textbox,
            type: "Textbox",
            idInternal: nanoid(),
          });
        }
      }
      if (quizTrack) {
        const quizzes: Quiz[] = JSON.parse(quizTrack.elementsJSON) as Quiz[];
        for (const quiz of quizzes) {
          parsedElements.push({
            ...quiz,
            type: "Quiz",
            idInternal: nanoid(),
          });
        }
      }
      parsedElements.sort((a, b) => a.start - b.start);

      dispatch(setInteractiveElements(parsedElements));
    }
  }, [dispatch, interactiveElements.length, textboxTrack, quizTrack]);

  const subtitleEditorStyle = css({
    display: "flex",
    flexDirection: "column",
    paddingRight: "20px",
    paddingLeft: "20px",
    gap: "20px",
    height: "100%",
  });

  const headerRowStyle = css({
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    gap: "10px",
    padding: "15px",
  });

  const subAreaStyle = css({
    display: "flex",
    flexDirection: "row",
    flexGrow: 1,  // No fixed height, fill available space
    justifyContent: "space-between",
    alignItems: "top",
    width: "100%",
    paddingTop: "10px",
    paddingBottom: "10px",
    gap: "30px",
    borderBottom: `${theme.menuBorder}`,
  });

  const render = () => {
    return (
      <>
        <div css={headerRowStyle}>
          <div css={[titleStyle(theme), titleStyleBold(theme), { padding: "0px" }]}>
            {t("interactiveElements.title")}
          </div>
        </div>
        <div css={subAreaStyle}>
          <InteractiveElementsList
          />
          <SubtitleVideoArea
            selectIsPlaying={selectIsPlaying}
            selectCurrentlyAt={selectCurrentlyAt}
            selectCurrentlyAtInSeconds={selectCurrentlyAtInSeconds}
            selectClickTriggered={selectClickTriggered}
            selectPreviewTriggered={selectPreviewTriggered}
            selectAspectRatio={selectAspectRatio}
            selectIsPlayPreview={selectIsPlayPreview}
            selectSelectedSubtitleById={dummy}
            setIsPlaying={setIsPlaying}
            setPreviewTriggered={setPreviewTriggered}
            setAspectRatio={setAspectRatio}
            setIsPlayPreview={setIsPlayPreview}
            setClickTriggered={setClickTriggered}
            setCurrentlyAtAndTriggerPreview={setCurrentlyAt}
          />
        </div>
        <div>
          <Timeline
            selectCurrentlyAt={selectCurrentlyAt}
            selectIsPlaying={selectIsPlaying}
            setClickTriggered={setClickTriggered}
            setCurrentlyAt={setCurrentlyAt}
            setIsPlaying={setIsPlaying}
            isInteractiveElements={true}
          />
        </div>
        <InteractiveElementsActions />
      </>
    );
  };

  return (
    <div css={subtitleEditorStyle}>
      {render()}
    </div>
  );
};

export default InteractiveElements;
