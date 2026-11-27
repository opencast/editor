import React from "react";

import { css } from "@emotion/react";

import { LuCircleCheck, LuDoorOpen } from "react-icons/lu";

import { basicButtonStyle, navigationButtonStyle } from "../cssStyles";

import { useTranslation } from "react-i18next";
import { useTheme } from "../themes";
import { settings } from "../config";
import { ProtoButton } from "@opencast/appkit";

/**
 * This page is to be displayed when the user is "done" with the editor
 * and should not be able to perfom any actions anymore
 */
const TheEnd: React.FC = () => {

  const { t } = useTranslation();

  const theEndStyle = css({
    width: "100%",
    height: "calc(100vh - 64px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
  });

  return (
    <div css={theEndStyle}>
      <LuCircleCheck css={{ fontSize: 80 }} />
      <div>{t("theEnd.info-text")}</div>
      <CallbackButton />
    </div>
  );
};

/**
 * Takes you back to the callback url resource
 */
const CallbackButton: React.FC = () => {

  const { t } = useTranslation();

  const theme = useTheme();

  const openCallbackUrl = () => {
    window.open(settings.callbackUrl, "_self");
  };

  return (
    <>
      {settings.callbackUrl !== undefined &&
        <ProtoButton
          onClick={openCallbackUrl}
          css={[basicButtonStyle(theme), navigationButtonStyle(theme)]}
        >
          <LuDoorOpen />
          <span>
            {settings.callbackSystem ?
              t("various.callback-button-system", { system: settings.callbackSystem }) :
              t("various.callback-button-generic")
            }
          </span>
        </ProtoButton>
      }
    </>
  );
};

export default TheEnd;
