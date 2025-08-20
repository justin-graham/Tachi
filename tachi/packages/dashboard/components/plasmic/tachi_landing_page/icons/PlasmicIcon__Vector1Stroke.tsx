/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Vector1StrokeIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Vector1StrokeIcon(props: Vector1StrokeIconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"none"}
      viewBox={"0 0 7 10"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        fill={"currentColor"}
        fillRule={"evenodd"}
        d={"M3.293 4.707 0 1.414 1.414 0l4.707 4.707-4.707 4.707L0 8z"}
        clipRule={"evenodd"}
      ></path>
    </svg>
  );
}

export default Vector1StrokeIcon;
/* prettier-ignore-end */
