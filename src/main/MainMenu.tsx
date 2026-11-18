import React from "react";

import { css, SerializedStyles } from "@emotion/react";

import { IconType } from "react-icons";
import {
  LuScissors, LuFilm, LuFileText, LuSquareCheckBig, LuBookOpenText, LuChevronLeft, LuChevronRight,
} from "react-icons/lu";
import { LuImage } from "react-icons/lu";
import SubtitleIcon from "../img/subtitle.svg?react";

import { useAppDispatch, useAppSelector } from "../redux/store";
import { setState, selectMainMenuState, mainMenu } from "../redux/mainMenuSlice";
import { setPageNumber } from "../redux/finishSlice";

import { MainMenuStateNames } from "../types";
import { settings } from "../config";
import { basicButtonStyle, BREAKPOINTS, undisplay } from "../cssStyles";
import { setIsPlaying } from "../redux/videoSlice";

import { useTranslation } from "react-i18next";
import { resetPostRequestState } from "../redux/workflowPostSlice";
import { setIsDisplayEditView } from "../redux/subtitleSlice";
import { setIsDisplayEditView as setIsDisplayEditViewThumbnail } from "../redux/thumbnailSlice";

import { useTheme } from "../themes";
import { ThemedTooltip } from "./Tooltip";
import { ProtoButton } from "@opencast/appkit";
import { screenWidthAtMost } from "@opencast/appkit";
import { useLocalStorage } from "usehooks-ts";

/**
 * A container for selecting the functionality shown in the main part of the app
 */
const MainMenu: React.FC = () => {

  const { t } = useTranslation();
  const theme = useTheme();

  const [collapsed, setCollapsed] = useLocalStorage("mainMenuCollapsed", false);

  const mainMenuStyle = css({
    borderRight: `${theme.menuBorder}`,
    width: collapsed ? "64px" : "96px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "8px",
    overflowX: "hidden",
    overflowY: "auto",
    background: `${theme.menu_background}`,
    gap: "12px",
    // The navigation is always collapsed on small screens
    [screenWidthAtMost(BREAKPOINTS.large)]: {
      width: "64px",
    },
  });

  const toggleStyle = css({
    alignSelf: collapsed ? "center" : "flex-end",
    padding: "4px",
    fontSize: "20px",
    outline: `${theme.menuButton_outline}`,
  });

  const toggleTooltip = collapsed ? t("mainMenu.expand-tooltip") : t("mainMenu.collapse-tooltip");

  // Hide labels when collapsed
  const label = (name: mainMenu["value"]) => collapsed ? "" : t(name);

  return (
    <nav css={mainMenuStyle} role="navigation" aria-label={t("mainMenu.tooltip-aria")}>
      <ThemedTooltip title={toggleTooltip}>
        <ProtoButton
          aria-label={toggleTooltip}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed(!collapsed)}
          css={[basicButtonStyle(theme), toggleStyle, undisplay(BREAKPOINTS.large)]}
        >
          {collapsed ? <LuChevronRight /> : <LuChevronLeft />}
        </ProtoButton>
      </ThemedTooltip>
      <MainMenuButton
        Icon={LuScissors}
        stateName={MainMenuStateNames.cutting}
        bottomText={label(MainMenuStateNames.cutting)}
        ariaLabelText={t(MainMenuStateNames.cutting)}
      />
      {settings.metadata.show && <MainMenuButton
        Icon={LuFileText}
        stateName={MainMenuStateNames.metadata}
        bottomText={label(MainMenuStateNames.metadata)}
        ariaLabelText={t(MainMenuStateNames.metadata)}
      />}
      {settings.trackSelection.show && <MainMenuButton
        Icon={LuFilm}
        stateName={MainMenuStateNames.trackSelection}
        bottomText={label(MainMenuStateNames.trackSelection)}
        ariaLabelText={t(MainMenuStateNames.trackSelection)}
      />}
      {settings.subtitles.show && <MainMenuButton
        Icon={SubtitleIcon}
        stateName={MainMenuStateNames.subtitles}
        bottomText={label(MainMenuStateNames.subtitles)}
        ariaLabelText={t(MainMenuStateNames.subtitles)}
      />}
      {settings.chapters.show && <MainMenuButton
        Icon={LuBookOpenText}
        stateName={MainMenuStateNames.chapters}
        bottomText={label(MainMenuStateNames.chapters)}
        ariaLabelText={t(MainMenuStateNames.chapters)}
      />}
      {settings.thumbnail.show && <MainMenuButton
        Icon={LuImage}
        stateName={MainMenuStateNames.thumbnail}
        bottomText={label(MainMenuStateNames.thumbnail)}
        ariaLabelText={t(MainMenuStateNames.thumbnail)}
      />}
      <MainMenuButton
        Icon={LuSquareCheckBig}
        stateName={MainMenuStateNames.finish}
        bottomText={label(MainMenuStateNames.finish)}
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

  const isActive = activeState === stateName;

  const mainMenuButtonStyle = css({
    width: "100%",
    padding: "4px 0",
    gap: "4px",
    flexDirection: "column",
    fontSize: "13px",
    outline: `${theme.menuButton_outline}`,
    // The accent color marks the active element. The icon gets the look of a button.
    color: isActive ? theme.accent_color : theme.text,
    "&:hover, &:focus": {
      backgroundColor: "transparent",
      color: isActive ? theme.accent_color : theme.text,
    },
    "&:hover svg": {
      borderColor: theme.accent_color,
    },
  });

  const mainMenuIconStyle = css({
    boxSizing: "border-box",
    width: "40px",
    height: "40px",
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid transparent",
    backgroundColor: theme.background,
    ...isActive && {
      borderColor: theme.accent_color,
      backgroundColor: theme.accent_bg,
    },
  });

  return (
    // Without a visible label, a tooltip tells what the button is
    <ThemedTooltip title={bottomText ? "" : ariaLabelText}>
      <ProtoButton
        role="menuitem"
        aria-label={ariaLabelText}
        onClick={onMenuItemClicked}
        css={[basicButtonStyle(theme), customCSS ? customCSS : mainMenuButtonStyle]}
      >
        <Icon css={iconCustomCSS ? iconCustomCSS : mainMenuIconStyle}/>
        {bottomText &&
        <div css={{
          [screenWidthAtMost(BREAKPOINTS.large)]: {
            display: "none",
          },
        }}>
          {bottomText}
        </div>}
      </ProtoButton>
    </ThemedTooltip>
  );
};

export default MainMenu;
