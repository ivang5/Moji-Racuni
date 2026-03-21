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
import Statistics from "./pages/Statistics";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Header />
        <Routes>
          <Route element={<PrivateRoute />} path="/">
            <Route element={<Home />} path="/" />
          </Route>
          <Route element={<PrivateRoute />} path="/racuni">
            <Route element={<Receipts />} path="/racuni" />
          </Route>
          <Route element={<PrivateRoute />} path="/racuni/strana/:page">
            <Route element={<Receipts />} path="/racuni/strana/:page" />
          </Route>
          <Route element={<PrivateRoute />} path="/prijave">
            <Route element={<Reports />} path="/prijave" />
          </Route>
          <Route element={<PrivateRoute />} path="/prijave/strana/:page">
            <Route element={<Reports />} path="/prijave/strana/:page" />
          </Route>
          <Route element={<PrivateRoute />} path="/preduzeca">
            <Route element={<Companies />} path="/preduzeca" />
          </Route>
          <Route element={<PrivateRoute />} path="/preduzeca/strana/:page">
            <Route element={<Companies />} path="/preduzeca/strana/:page" />
          </Route>
          <Route element={<PrivateRoute />} path="/korisnici">
            <Route element={<Users />} path="/korisnici" />
          </Route>
          <Route element={<PrivateRoute />} path="/korisnici/strana/:page">
            <Route element={<Users />} path="/korisnici/strana/:page" />
          </Route>
          <Route element={<PrivateRoute />} path="/profil">
            <Route element={<Profile />} path="/profil" />
          </Route>
          <Route element={<PrivateRoute />} path="/statistika">
            <Route element={<Statistics />} path="/statistika" />
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
