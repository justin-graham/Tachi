/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type CloseCircleIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function CloseCircleIcon(props: CloseCircleIconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"none"}
      viewBox={"0 0 16 16"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        fill={"currentColor"}
        d={
          "M6.113 10.387a.5.5 0 0 1-.353-.147.503.503 0 0 1 0-.707L9.533 5.76a.503.503 0 0 1 .707 0 .503.503 0 0 1 0 .707L6.467 10.24a.48.48 0 0 1-.354.147"
        }
      ></path>

      <path
        fill={"currentColor"}
        d={
          "M9.887 10.387a.5.5 0 0 1-.354-.147L5.76 6.467a.503.503 0 0 1 0-.707.503.503 0 0 1 .707 0l3.773 3.773a.503.503 0 0 1 0 .707c-.1.1-.227.147-.353.147"
        }
      ></path>
    </svg>
  );
}

export default CloseCircleIcon;
/* prettier-ignore-end */
