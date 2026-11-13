import React from "react";

import { css } from "@emotion/react";

import { useTranslation } from "react-i18next";

/**
 * This page is to be displayed when the application has run into a critical error
 * from which it cannot recover.
 */
const Landing: React.FC = () => {

  const { t } = useTranslation();

  const landingStyle = css({
    display: "flex",
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",

    a: {
      color: "#007bff",
      textDecoration: "none",
    },
    li: {
      margin: "5px",
    },
    code: {
      userSelect: "all",
      color: "#e83e8c",
    },
  });

  return (
    <div css={landingStyle} >
      <h1>{t("landing.main-heading")}</h1>
      <div>
        <li>
          {t("landing.contact-admin")}
        </li>
        <li>
          {t("landing.start-editing-1")}
          <code> ?id=[media-package-id]</code>
          {t("landing.start-editing-2")}
        </li>
        <li>
          {t("landing.link-to-documentation")}
          <a href="https://docs.opencast.org/stable/admin/modules/editor/">
            docs.opencast.org
          </a>
        </li>
      </div>
    </div>
  );
};

export default Landing;
