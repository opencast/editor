import React from "react";

import { css, SerializedStyles } from "@emotion/react";

import { IconType } from "react-icons";
import {
  LuScissors,
  LuFilm,
  LuFileText,
  LuSquareCheckBig,
  LuBookOpenText,
  LuMessageCircle,
  LuImage,
} from "react-icons/lu";
import SubtitleIcon from "../img/subtitle.svg?react";

import { useAppDispatch, useAppSelector } from "../redux/store";
import { setState, selectMainMenuState, mainMenu } from "../redux/mainMenuSlice";
import { setPageNumber } from "../redux/finishSlice";

import { MainMenuStateNames } from "../types";
import { settings } from "../config";
import { basicButtonStyle, BREAKPOINTS } from "../cssStyles";
import { setIsPlaying } from "../redux/videoSlice";

import { useTranslation } from "react-i18next";
import { resetPostRequestState } from "../redux/workflowPostSlice";
import { setIsDisplayEditView } from "../redux/subtitleSlice";
import { setIsDisplayEditView as setIsDisplayEditViewThumbnail } from "../redux/thumbnailSlice";

import { useTheme } from "../themes";
import { ProtoButton } from "@opencast/appkit";
import { screenWidthAtMost } from "@opencast/appkit";

/**
 * A container for selecting the functionality shown in the main part of the app
 */
const MainMenu: React.FC = () => {

  const { t } = useTranslation();
  const theme = useTheme();

  const mainMenuStyle = css({
    borderRight: `${theme.menuBorder}`,
    minWidth: "120px",
    maxWidth: "140px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    overflowX: "hidden",
    overflowY: "auto",
    background: `${theme.menu_background}`,
    gap: "30px",
    [screenWidthAtMost(BREAKPOINTS.large)]: {
      minWidth: "60px",
      padding: "20px 10px",
    },
  });

  return (
    <nav css={mainMenuStyle} role="navigation" aria-label={t("mainMenu.tooltip-aria")}>
      <MainMenuButton
        Icon={LuScissors}
        stateName={MainMenuStateNames.cutting}
        bottomText={t(MainMenuStateNames.cutting)}
        ariaLabelText={t(MainMenuStateNames.cutting)}
      />
      {settings.metadata.show && <MainMenuButton
        Icon={LuFileText}
        stateName={MainMenuStateNames.metadata}
        bottomText={t(MainMenuStateNames.metadata)}
        ariaLabelText={t(MainMenuStateNames.metadata)}
      />}
      {settings.trackSelection.show && <MainMenuButton
        Icon={LuFilm}
        stateName={MainMenuStateNames.trackSelection}
        bottomText={t(MainMenuStateNames.trackSelection)}
        ariaLabelText={t(MainMenuStateNames.trackSelection)}
      />}
      {settings.subtitles.show && <MainMenuButton
        Icon={SubtitleIcon}
        stateName={MainMenuStateNames.subtitles}
        bottomText={t(MainMenuStateNames.subtitles)}
        ariaLabelText={t(MainMenuStateNames.subtitles)}
      />}
      {settings.chapters.show && <MainMenuButton
        Icon={LuBookOpenText}
        stateName={MainMenuStateNames.chapters}
        bottomText={t(MainMenuStateNames.chapters)}
        ariaLabelText={t(MainMenuStateNames.chapters)}
      />}
      {settings.thumbnail.show && <MainMenuButton
        Icon={LuImage}
        stateName={MainMenuStateNames.thumbnail}
        bottomText={t(MainMenuStateNames.thumbnail)}
        ariaLabelText={t(MainMenuStateNames.thumbnail)}
      />}
      {settings.comments.show && <MainMenuButton
        Icon={LuMessageCircle}
        stateName={MainMenuStateNames.comments}
        bottomText={t(MainMenuStateNames.comments)}
        ariaLabelText={t(MainMenuStateNames.comments)}
      />}
      <MainMenuButton
        Icon={LuSquareCheckBig}
        stateName={MainMenuStateNames.finish}
        bottomText={t(MainMenuStateNames.finish)}
        ariaLabelText={t(MainMenuStateNames.finish)}
      />
    </nav>
  );
};

interface mainMenuButtonInterface {
  Icon: IconType | React.FunctionComponent,
  stateName: mainMenu["value"],
  bottomText: string,
  ariaLabelText: string;
  customCSS?: SerializedStyles,
  iconCustomCSS?: SerializedStyles,
}

/**
 * A button to set the state of the app
 * @param param0
 */
export const MainMenuButton: React.FC<mainMenuButtonInterface> = ({
  Icon,
  stateName,
  bottomText,
  ariaLabelText,
  customCSS,
  iconCustomCSS,
}) => {

  const dispatch = useAppDispatch();
  const activeState = useAppSelector(selectMainMenuState);
  const theme = useTheme();

  const onMenuItemClicked = () => {
    dispatch(setState(stateName));
    // Reset multi-page content to their first page
    if (stateName === MainMenuStateNames.finish) {
      dispatch(setPageNumber(0));
    }
    if (stateName === MainMenuStateNames.subtitles) {
      dispatch(setIsDisplayEditView(false));
    }
    if (stateName === MainMenuStateNames.thumbnail) {
      dispatch(setIsDisplayEditViewThumbnail(false));
    }
    // Halt ongoing events
    dispatch(setIsPlaying(false));
    // Reset states
    dispatch(resetPostRequestState());
  };

  const mainMenuButtonStyle = css({
    width: "100%",
    height: "100px",
    outline: `${theme.menuButton_outline}`,
    ...(activeState === stateName) && {
      backgroundColor: `${theme.button_color}`,
      color: `${theme.inverted_text}`,
      boxShadow: `${theme.boxShadow}`,
    },
    "&:hover": {
      backgroundColor: `${theme.button_color}`,
      color: `${theme.inverted_text}`,
      boxShadow: `${theme.boxShadow}`,
    },
    flexDirection: "column",
    [screenWidthAtMost(BREAKPOINTS.large)]: {
      height: "60px",
      minHeight: "40px",
    },
  });

  return (
    <ProtoButton
      role="menuitem"
      aria-label={ariaLabelText}
      onClick={onMenuItemClicked}
      css={[basicButtonStyle(theme), customCSS ? customCSS : mainMenuButtonStyle]}
    >
      <Icon css={iconCustomCSS ? iconCustomCSS : {
        fontSize: 36,
        width: "36px",
        height: "auto",
      }}/>
      {bottomText &&
      <div css={{
        [screenWidthAtMost(BREAKPOINTS.large)]: {
          display: "none",
        },
      }}>
        {bottomText}
      </div>}
    </ProtoButton>
  );
};

export default MainMenu;
