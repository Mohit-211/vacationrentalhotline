"use client";

import React, { useEffect, useState } from "react";
import {
  Container,
  Nav,
  NavDropdown,
  Navbar,
  OverlayTrigger,
  Tooltip,
  Offcanvas,
} from "react-bootstrap";
import styles from "./Header.module.scss";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@public/logo-2.png";
import Image from "next/image";
import {
  getToken,
  clearToken,
} from "@/lib/session";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const token = getToken();
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const handleScrollLinkClick = (sectionId: string) => {
    const path = "/";
    if (pathname !== path) {
      router.push(`${path}#${sectionId}`);
    } else {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    router.push("/");
    clearToken();
  };

  return (
    <div className={styles.headerSection}>
      <Navbar collapseOnSelect expand="lg" className="bg-body-tertiary">
        <Container>
          <Navbar.Brand href="/">
            <Image src={Logo} height={50} alt="Logo" />
          </Navbar.Brand>
          <Navbar.Toggle
            aria-controls="responsive-navbar-nav"
            onClick={() => setShowOffcanvas(true)}
          />
          <div className="desktop">
            <Nav>
              {isClient && pathname === "/" && (
                <>
                  <Nav.Link
                    className="nav-link"
                    onClick={() => handleScrollLinkClick("banner-section")}
                  >
                    Home
                  </Nav.Link>
                  <Nav.Link
                    className="nav-link"
                    onClick={() => handleScrollLinkClick("about-section")}
                  >
                    About
                  </Nav.Link>
                  <Nav.Link
                    className="nav-link"
                    onClick={() => handleScrollLinkClick("contact-us")}
                  >
                    Contact
                  </Nav.Link>
                </>
              )}

              {isClient && token ? (
                <NavDropdown title="My Account" id="basic-nav-dropdown">
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip id="tooltip-logout">
                        Logout from your account
                      </Tooltip>
                    }
                  >
                    <>
                      <NavDropdown.Item>
                        <div
                          className="item_btn"
                          onClick={() => router.push("/profile")}
                        >
                          Profile
                        </div>
                      </NavDropdown.Item>
                      <NavDropdown.Item>
                        <div
                          className="item_btn"
                          onClick={() => router.push("/dashboard")}
                        >
                          Dashboard
                        </div>
                      </NavDropdown.Item>
                      <NavDropdown.Item>
                        <div className="item_btn" onClick={handleLogout}>
                          Logout
                        </div>
                      </NavDropdown.Item>
                    </>
                  </OverlayTrigger>
                </NavDropdown>
              ) : (
                <>
                  <Nav.Link
                    className={styles.Login}
                    onClick={() => {
                      const path = "/signup";
                      router.push(path);
                    }}
                  >
                    Sign Up
                  </Nav.Link>
                  <Nav.Link
                    className={styles.Login}
                    onClick={() => router.push("/login")}
                  >
                    Login
                  </Nav.Link>
                </>
              )}
            </Nav>
          </div>
        </Container>
      </Navbar>

      <Offcanvas show={showOffcanvas} onHide={() => setShowOffcanvas(false)}>
        <Offcanvas.Body>
          <Nav className="flex-column">
            {isClient && pathname === "/" && (
              <>
                <Nav.Link
                  className="nav-link"
                  onClick={() => handleScrollLinkClick("banner-section")}
                >
                  Home
                </Nav.Link>
                <Nav.Link
                  className="nav-link"
                  onClick={() => handleScrollLinkClick("about-section")}
                >
                  About
                </Nav.Link>
                <Nav.Link
                  className="nav-link"
                  onClick={() => handleScrollLinkClick("contact-us")}
                >
                  Contact
                </Nav.Link>
              </>
            )}
            {isClient && token ? (
              <>
                <NavDropdown.Item>
                  <div
                    className="item_btn"
                    style={{ marginTop: "10px", width: "200px" }}
                    onClick={() => router.push("/change-password")}
                  >
                    Change Password
                  </div>
                </NavDropdown.Item>
                <NavDropdown.Item>
                  <div
                    className="item_btn"
                    style={{ marginTop: "10px", width: "200px" }}
                    onClick={() => router.push("/dashboard")}
                  >
                    Dashboard
                  </div>
                </NavDropdown.Item>
                <NavDropdown.Item>
                  <div
                    className="item_btn"
                    style={{ marginTop: "10px", width: "200px" }}
                    onClick={handleLogout}
                  >
                    Logout
                  </div>
                </NavDropdown.Item>
              </>
            ) : (
              <>
                <Nav.Link
                  className="res_Login"
                  onClick={() => router.push("/signup")}
                >
                  Sign Up
                </Nav.Link>
                <Nav.Link
                  className="res_Login"
                  onClick={() => router.push("/login")}
                >
                  Login
                </Nav.Link>
              </>
            )}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default Header;
