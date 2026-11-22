"use client";

import React from "react";
import { Button, Card, Container } from "react-bootstrap";
import Logo from "@public/logo-2.png";
import { IoMdArrowRoundBack } from "react-icons/io";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface StatusMessageProps {
  subject: string;
  text: string;
  buttonText: string;
  onButtonClick?: () => void;
  useHtmlText?: boolean;
}

const StatusMessage = ({
  subject,
  text,
  buttonText,
  onButtonClick,
  useHtmlText = true,
}: StatusMessageProps) => {
  const router=useRouter()
  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <Card
        style={{
          maxWidth: "1000px",
          textAlign: "center",
          padding: "80px 60px",
        }}
      >
        <div className="main_heading">
          <div
            onClick={() => {
              router.push("/");
            }}
            style={{ cursor: "pointer" }}
          >
            <Image src={Logo} height={50} alt="Logo" />
          </div>
          <div
            className="innerheading"
            onClick={() => {
              router.push("/");
            }}
            style={{ cursor: "pointer" }}
          >
            <IoMdArrowRoundBack />
            <div>Go to Home</div>
          </div>
        </div>
        <div className="EmailSentMessage m-2">
          <h3 className="mb-3">{subject}</h3>
          {useHtmlText ? (
            <p
              dangerouslySetInnerHTML={{ __html: text }}
              style={{ textAlign: "left" }}
            ></p>
          ) : (
            <p style={{ textAlign: "left" }}>{text}</p>
          )}
          <Button
            className="submit_btn_theme p-2"
            onClick={onButtonClick}
            style={{ border: "none" ,width:"fit-content"}}
          >
            {buttonText}
          </Button>
          {subject==="Almost there! Verify Your Email"&&
          <div className="bottomText">
                Go to{" "}
                <span
                  onClick={() => {
                    router.push("/login");
                  }}
                  style={{ cursor: "pointer", color: "blue" }}
                  >
                  Login
                </span>
              </div>
                }
        </div>
      </Card>
    </Container>
  );
};

export default StatusMessage;
