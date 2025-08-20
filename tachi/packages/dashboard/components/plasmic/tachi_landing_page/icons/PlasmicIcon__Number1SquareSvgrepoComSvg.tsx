/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Number1SquareSvgrepoComSvgIconProps =
  React.ComponentProps<"svg"> & {
    title?: string;
  };

export function Number1SquareSvgrepoComSvgIcon(
  props: Number1SquareSvgrepoComSvgIconProps
) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      xmlnsXlink={"http://www.w3.org/1999/xlink"}
      fill={"none"}
      viewBox={"0 0 24 24"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <g
        stroke={"#292929"}
        strokeLinecap={"round"}
        strokeLinejoin={"round"}
        strokeWidth={"2.5"}
        clipPath={"url(#a)"}
      >
        <path d={"M4 4.001h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"}></path>

        <path d={"M12.5 17V7l-2 2"}></path>
      </g>

      <defs>
        <clipPath id={"a"}>
          <path fill={"#fff"} d={"M0 0h24v24H0z"}></path>
        </clipPath>
      </defs>
    </svg>
  );
}

export default Number1SquareSvgrepoComSvgIcon;
/* prettier-ignore-end */
