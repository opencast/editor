import React, { useEffect, useRef } from "react";

import Metadata from "./Metadata";
import TrackSelection from "./TrackSelection";
import Subtitle from "./Subtitle";
import KeyboardControls from "./KeyboardControls";

import { LuWrench } from "react-icons/lu";

import { css } from "@emotion/react";

import { useAppSelector } from "../redux/store";
import { selectMainMenuState } from "../redux/mainMenuSlice";

import { MainMenuStateNames } from "../types";

import { useBeforeunload } from "react-beforeunload";
import { useHasUnsavedChanges } from "../util/useSaveChanges";
import { useTheme } from "../themes";
import Thumbnail from "./Thumbnail";
import Cutting from "./Cutting";
import Chapter from "./Chapter";

/**
 * A container for the main functionality
 * Shows different components depending on the state off the app
 */
const MainContent: React.FC = () => {

  const mainMenuState = useAppSelector(selectMainMenuState);
  const hasUnsavedChanges = useHasUnsavedChanges();
  const theme = useTheme();

  // Display warning when leaving the page if there are unsaved changes
  useBeforeunload((event: { preventDefault: () => void; }) => {
    if (hasUnsavedChanges) {
      event.preventDefault();
    }
  });

  const mainContentStyle = css({
    display: "flex",
    paddingRight: "20px",
    paddingLeft: "20px",
    gap: "20px",
    background: `${theme.background}`,
    // Fill the space below the action bar and scroll inside it
    flex: 1,
    minHeight: 0,
    overflow: "auto",
  });

  const cuttingStyle = css({
    flexDirection: "column",
  });

  const metadataStyle = css({
  });

  const trackSelectStyle = css({
    flexDirection: "column",
    alignContent: "space-around",
  });

  const subtitleSelectStyle = css({
    flexDirection: "column",
    justifyContent: "space-around",
  });

  const thumbnailSelectStyle = css({
    flexDirection: "column",
    alignContent: "space-around",
  });

  const keyboardControlsStyle = css({
    flexDirection: "column",
  });

  const defaultStyle = css({
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
  });

  // Apply main focus to the current view for keyboard hotkeys.
  const mainRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Auto-focus main content when route changes
    mainRef.current?.focus();
  }, [mainMenuState]);

  const render = () => {
    if (mainMenuState === MainMenuStateNames.cutting) {
      return (
        <div css={[mainContentStyle, cuttingStyle]} role="main"
          ref={mainRef} tabIndex={-1} style={{ outline: "none" }}
        >
          <Cutting />
        </div>
      );
    } else if (mainMenuState === MainMenuStateNames.metadata) {
      return (
        <div css={[mainContentStyle, metadataStyle]} role="main"
          ref={mainRef} tabIndex={-1} style={{ outline: "none" }}
        >
          <Metadata />
        </div>
      );
    } else if (mainMenuState === MainMenuStateNames.trackSelection) {
      return (
        <div css={[mainContentStyle, trackSelectStyle]} role="main"
          ref={mainRef} tabIndex={-1} style={{ outline: "none" }}
        >
          <TrackSelection />
        </div>
      );
    } else if (mainMenuState === MainMenuStateNames.subtitles) {
      return (
        <div css={[mainContentStyle, subtitleSelectStyle]} role="main"
          ref={mainRef} tabIndex={-1} style={{ outline: "none" }}
        >
          <Subtitle />
        </div>
      );
    } else if (mainMenuState === MainMenuStateNames.chapters) {
      return (
        <div css={[mainContentStyle, subtitleSelectStyle]} role="main">
          <Chapter />
        </div>
      );
    } else if (mainMenuState === MainMenuStateNames.thumbnail) {
      return (
        <div css={[mainContentStyle, thumbnailSelectStyle]} role="main"
          ref={mainRef} tabIndex={-1} style={{ outline: "none" }}
        >
          <Thumbnail />
        </div>
      );
    } else if (mainMenuState === MainMenuStateNames.keyboardControls) {
      return (
        <div css={[mainContentStyle, keyboardControlsStyle]} role="main"
          ref={mainRef} tabIndex={-1} style={{ outline: "none" }}
        >
          <KeyboardControls />
        </div>
      );
    } else {
      <div css={[mainContentStyle, defaultStyle]} role="main"
        ref={mainRef} tabIndex={-1} style={{ outline: "none" }}
      >
        <LuWrench css={{ fontSize: 80 }} />
        Placeholder
      </div>;
    }
  };

  return (
    <>{render()}</>
  );
};

export default MainContent;
