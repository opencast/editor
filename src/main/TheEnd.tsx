import React from "react";

import { css } from "@emotion/react";

import { LuCircleCheck, LuCircleX } from "react-icons/lu";

import { useAppSelector } from "../redux/store";
import { selectEndState } from "../redux/endSlice";
import { basicButtonStyle, navigationButtonStyle } from "../cssStyles";

import { useTranslation } from "react-i18next";
import { useTheme } from "../themes";
import { ThemedTooltip } from "./Tooltip";
import { CallbackButton } from "./Finish";
import { ProtoButton } from "@opencast/appkit";

/**
 * This page is to be displayed when the user is "done" with the editor
 * and should not be able to perfom any actions anymore
 */
const TheEnd: React.FC = () => {

  const { t } = useTranslation();

  // Init redux variables
  const endState = useAppSelector(selectEndState);

  const text = () => {
    if (endState === "discarded") {
      return t("theEnd.discarded-text");
    } else if (endState === "success") {
      return t("theEnd.info-text");
    }
  };

  const theEndStyle = css({
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
  });

  const restartOrBackStyle = css({
    display: "flex",
    flexDirection: "row",
    gap: "20px",
  });

  return (
    <div css={theEndStyle}>
      {endState === "discarded" ? <LuCircleX css={{ fontSize: 80 }} /> : <LuCircleCheck css={{ fontSize: 80 }} />}
      <div>{text()}</div>
      <div css={restartOrBackStyle}>
        <CallbackButton />
        {(endState === "discarded") && <StartOverButton />}
      </div>
    </div>
  );
};


const StartOverButton: React.FC = () => {

  const { t } = useTranslation();
  const theme = useTheme();

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <ThemedTooltip title={t("theEnd.startOver-tooltip")}>
      <ProtoButton
        onClick={reloadPage}
        css={[basicButtonStyle(theme), navigationButtonStyle(theme)]}
      >
        <span>{t("theEnd.startOver-button")}</span>
      </ProtoButton>
    </ThemedTooltip>
  );
};

export default TheEnd;
