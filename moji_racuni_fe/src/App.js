import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./utils/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Header from "./components/Header";
import Receipts from "./pages/Receipts";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Header />
        <Routes>
          <Route element={<PrivateRoute />} exact path="/">
            <Route element={<Home />} exact path="/" />
          </Route>
          <Route element={<PrivateRoute />} exact path="/racuni/strana/:page">
            <Route element={<Receipts />} exact path="/racuni/strana/:page" />
          </Route>
          <Route element={<Login />} path="/prijava" />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
