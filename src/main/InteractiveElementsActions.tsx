import React, { useRef, useState } from "react";

import { BREAKPOINTS, basicButtonStyle, undisplay } from "../cssStyles";

import { LuFileQuestion, LuType } from "react-icons/lu";

import { css } from "@emotion/react";

import { useAppDispatch, useAppSelector } from "../redux/store";
import {
  selectCurrentlyAt,
} from "../redux/videoSlice";
import { rewriteKeys } from "../globalKeys";
import { ActionCreatorWithoutPayload, PayloadActionCreator } from "@reduxjs/toolkit";

import { useTranslation } from "react-i18next";
import { useTheme } from "../themes";
import { ThemedTooltip } from "./Tooltip";
import { ModalHandle, ProtoButton } from "@opencast/appkit";
import { ZoomSlider } from "./CuttingActions";
import InteractiveElementsEditor from "./InteractiveElementEditor";
import { InteractiveElement } from "../redux/interactiveElementsSlice";
import { selectKeymap } from "../redux/hotkeySlice";

/**
 * Defines the different actions a user can perform while in cutting mode
 */
const InteractiveElementsActions: React.FC = () => {

  const { t } = useTranslation();

  // Init redux variables
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const keymap = useAppSelector(selectKeymap);

  const modalRef = useRef<ModalHandle>(null);
  const [type, setType] = useState<InteractiveElement["type"]>("Textbox");

  const currentlyAt = useAppSelector(selectCurrentlyAt);

  /**
   * General action callback for cutting actions
   * @param event event triggered by click or button press
   * @param action redux event to dispatch
   * @param ref Pass a reference if the clicked element should lose focus
   */
  const dispatchAction = <T, >(
    action: ActionCreatorWithoutPayload<string> | undefined,
    actionWithPayload?: PayloadActionCreator<T, string>,
    payload?: T,
    ref?: React.RefObject<HTMLButtonElement>,
  ) => {
    if (action) {
      dispatch(action());
    }
    if (actionWithPayload) {
      dispatch(actionWithPayload(payload));
    }

    // Lose focus if clicked by mouse
    if (ref) {
      ref.current?.blur();
    }
  };

  const cuttingStyle = css({
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  });

  const cuttingActionButtonStyle = css({
    padding: "16px",
  });

  const verticalLineStyle = css({
    borderLeft: "2px solid #DDD;",
    height: "32px",
  });

  return (
    <div css={cuttingStyle}>
      <InteractiveElementsEditor
        element={{
          start: currentlyAt,
          type: type,
        }}
        modalRef={modalRef}
      />
      <ThemedTooltip title={t("interactiveElements.addTextbox-tooltip")}>
        <ProtoButton
          aria-label={t("interactiveElements.addTextbox-tooltip-aria")}
          onClick={() => {
            setType("Textbox");
            modalRef.current?.open();
          }}
          css={[basicButtonStyle(theme), cuttingActionButtonStyle]}
        >
          <LuType />
          <span css={undisplay(BREAKPOINTS.medium)}>{t("interactiveElements.addTextbox")}</span>
        </ProtoButton>
      </ThemedTooltip>
      <div css={verticalLineStyle} />
      <ThemedTooltip title={t("interactiveElements.addQuiz-tooltip")}>
        <ProtoButton
          aria-label={t("interactiveElements.addQuiz-tooltip-aria")}
          onClick={() => {
            setType("Quiz");
            modalRef.current?.open();
          }}
          css={[basicButtonStyle(theme), cuttingActionButtonStyle]}
        >
          <LuFileQuestion />
          <span css={undisplay(BREAKPOINTS.medium)}>{t("interactiveElements.addQuiz")}</span>
        </ProtoButton>
      </ThemedTooltip>
      <div css={verticalLineStyle} />
      <ZoomSlider actionHandler={dispatchAction}
        tooltip={t("cuttingActions.zoomSlider-tooltip", {
          hotkeyNameIn: rewriteKeys(keymap.cutting.zoomIn),
          hotkeyNameOut: rewriteKeys(keymap.cutting.zoomOut),
        })}
        ariaLabelText={t("cuttingActions.zoomSlider-aria", {
          hotkeyNameIn: rewriteKeys(keymap.cutting.zoomIn),
          hotkeyNameOut: rewriteKeys(keymap.cutting.zoomOut),
        })}
      />
    </div>
  );
};

export default InteractiveElementsActions;
