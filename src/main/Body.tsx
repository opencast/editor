import React from "react";

import MainMenu from "./MainMenu";
import MainContent from "./MainContent";
import TheEnd from "./TheEnd";
import Error from "./Error";
import Landing from "./Landing";
import Lock from "./Lock";
import ActionBar from "./ActionBar";

import { css } from "@emotion/react";

import { useAppSelector } from "../redux/store";
import { selectIsEnd } from "../redux/endSlice";
import { selectIsError } from "../redux/errorSlice";
import { settings } from "../config";

const Body: React.FC = () => {

  const isEnd = useAppSelector(selectIsEnd);
  const isError = useAppSelector(selectIsError);

  // If we"re in a special state, display a special page
  // Otherwise display the normal page
  const main = () => {
    if (!settings.id) {
      return (
        <Landing />
      );
    } else if (isEnd) {
      return (
        <div>
          <Lock />
          <TheEnd />
        </div>
      );
    } else if (isError) {
      return (
        <div css={css({ height: "calc(100% - 64px)" })}>
          <Error />
        </div>
      );
    } else {
      return (
        <div css={bodyStyle}>
          <Lock />
          <MainMenu />
          <div css={contentStyle}>
            <ActionBar />
            <MainContent />
          </div>
        </div>
      );
    }
  };

  const contentStyle = css({
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: 0,
  });

  const bodyStyle = css({
    display: "flex",
    flexDirection: "row",
    height: "calc(100% - 64px)",
  });

  return (
    <React.Fragment>
      {main()}
    </React.Fragment>
  );
};

export default Body;
