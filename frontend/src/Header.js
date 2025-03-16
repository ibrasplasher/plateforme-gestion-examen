// src/components/Header.js
import React from "react";

const Header = () => (
  <div className="row header shadow-sm">
    <div className="col-sm-3 pl-0 text-center header-logo">
      <div className="bg-theme mr-3 pt-3 pb-2 mb-0">
        <h3 className="logo">
          <a href="#" className="text-secondary logo">
            <i className="fa fa-rocket"></i> ExamX
            <span className="small">pert</span>
          </a>
        </h3>
      </div>
    </div>
    <div className="col-sm-9 header-menu pt-2 pb-0">
      <div className="row">
        <div className="col-sm-4 col-8 pl-0">
          <span
            className="menu-icon"
            onClick={() => console.log("Sidebar toggle")}
          >
            <span id="sidebar-toggle-btn"></span>
          </span>
        </div>
        <div className="col-sm-8 col-4 text-right flex-header-menu justify-content-end">
          <h6 className="mb-2">
            Dashboard <i className="fa fa-angle-right"></i> Visualiser les
            corrections
          </h6>
        </div>
      </div>
    </div>
  </div>
);

export default Header;
