import Body from "./main/Body";
import Header from "./main/Header";
import { GlobalStyle } from "./cssStyles";

function App() {
  return (
    <div css={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <GlobalStyle />
      <Header />
      <Body />
    </div>
  );
}

export default App;
