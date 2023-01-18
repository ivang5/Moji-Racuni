import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./utils/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Header from "./components/Header";
import Receipts from "./pages/Receipts";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import Companies from "./pages/Companies";
import Users from "./pages/Users";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Header />
        <Routes>
          <Route element={<PrivateRoute />} exact path="/">
            <Route element={<Home />} exact path="/" />
          </Route>
          <Route element={<PrivateRoute />} exact path="/racuni">
            <Route element={<Receipts />} exact path="/racuni" />
          </Route>
          <Route element={<PrivateRoute />} exact path="/racuni/strana/:page">
            <Route element={<Receipts />} exact path="/racuni/strana/:page" />
          </Route>
          <Route element={<PrivateRoute />} exact path="/prijave">
            <Route element={<Reports />} exact path="/prijave" />
          </Route>
          <Route element={<PrivateRoute />} exact path="/prijave/strana/:page">
            <Route element={<Reports />} exact path="/prijave/strana/:page" />
          </Route>
          <Route element={<PrivateRoute />} exact path="/preduzeca">
            <Route element={<Companies />} exact path="/preduzeca" />
          </Route>
          <Route
            element={<PrivateRoute />}
            exact
            path="/preduzeca/strana/:page"
          >
            <Route
              element={<Companies />}
              exact
              path="/preduzeca/strana/:page"
            />
          </Route>
          <Route element={<PrivateRoute />} exact path="/korisnici">
            <Route element={<Users />} exact path="/korisnici" />
          </Route>
          <Route
            element={<PrivateRoute />}
            exact
            path="/korisnici/strana/:page"
          >
            <Route element={<Users />} exact path="/korisnici/strana/:page" />
          </Route>
          <Route element={<PrivateRoute />} exact path="/profil">
            <Route element={<Profile />} exact path="/profil" />
          </Route>
          <Route element={<Login />} path="/prijava" />
          <Route path="*" element={<PrivateRoute />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
