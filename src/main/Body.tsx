import React from "react";

import MainMenu from "./MainMenu";
import MainContent from "./MainContent";
import TheEnd from "./TheEnd";
import Error from "./Error";
import Landing from "./Landing";
import Lock from "./Lock";

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
        <div css={fillRemainingStyle}>
          <Lock />
          <TheEnd />
        </div>
      );
    } else if (isError) {
      return (
        <div css={fillRemainingStyle}>
          <Error />
        </div>
      );
    } else {
      return (
        <div css={bodyStyle}>
          <Lock />
          <MainMenu />
          <MainContent />
        </div>
      );
    }
  };

  const fillRemainingStyle = css({
    flex: 1,
    minHeight: 0,
  });

  const bodyStyle = css([fillRemainingStyle, {
    display: "flex",
    flexDirection: "row",
  }]);

  return (
    <React.Fragment>
      {main()}
    </React.Fragment>
  );
};

export default Body;
