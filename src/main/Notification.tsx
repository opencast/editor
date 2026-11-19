import React from "react";

import { css } from "@emotion/react";

import { useTheme } from "../themes";

/**
 * A small box that gives the user feedback about something that just happened.
 * Put it into a `role="status"` element so that screen readers announce it.
 */
const Notification: React.FC<React.PropsWithChildren> = ({ children }) => {

  const theme = useTheme();

  const notificationStyle = css({
    maxWidth: "360px",
    padding: "8px 12px",
    borderRadius: "8px",
    border: `1px solid ${theme.accent_color}`,
    backgroundColor: theme.accent_bg,
    color: theme.text,
  });

  return <div css={notificationStyle}>{children}</div>;
};

export default Notification;
