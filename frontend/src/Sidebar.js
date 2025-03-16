// src/components/Sidebar.js
import React from "react";

const Sidebar = () => (
  <div className="col-sm-3 col-xs-6 sidebar pl-0">
    <div className="inner-sidebar mr-3">
      <div className="avatar text-center">
        <img
          src="assets/img/client-img4.png"
          alt=""
          className="rounded-circle"
        />
        <p>
          <strong> NOM UTILISATEUR </strong>
        </p>
        <span className="text-primary small">
          <strong>PROFFESSION UTILISATEUR</strong>
        </span>
      </div>
      <div className="sidebar-menu-container">
        <ul className="sidebar-menu mt-4 mb-4">
          {/* Ajoute ici les liens de la sidebar */}
        </ul>
      </div>
    </div>
  </div>
);

export default Sidebar;
