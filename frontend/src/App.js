// src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import RegistrationForm from "./components/RegistrationForm";

const App = () => (
  <Router>
    <div className="container-fluid">
      <Header />
      <div className="row main-content">
        <Sidebar />
        <div className="col-sm-9 col-xs-12 content pt-3 pl-0">
          <Switch>
            <Route path="/registration" component={RegistrationForm} />
            {/* Ajoute d'autres routes ici */}
          </Switch>
        </div>
      </div>
    </div>
  </Router>
);

export default App;
