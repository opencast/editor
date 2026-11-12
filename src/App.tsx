import Body from "./main/Body";
import Header from "./main/Header";
import { GlobalStyle } from "./cssStyles";

function App() {
  return (
    <div className="App" css={{ display: "flex", flexDirection: "column" }}>
      <GlobalStyle />
      <Header />
      <Body />
    </div>
  );
}

export default App;
