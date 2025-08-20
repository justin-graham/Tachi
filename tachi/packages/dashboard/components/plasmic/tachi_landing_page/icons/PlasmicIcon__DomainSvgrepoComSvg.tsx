/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type DomainSvgrepoComSvgIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function DomainSvgrepoComSvgIcon(props: DomainSvgrepoComSvgIconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      xmlSpace={"preserve"}
      fill={"currentColor"}
      version={"1.1"}
      viewBox={"0 0 24 24"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        d={"M24 22H0V2h24zM2 20h20V4h-8v2h-2V4h-2v2H8V4H6v2H4V4H2v2h20v2H2z"}
      ></path>
    </svg>
  );
}

export default DomainSvgrepoComSvgIcon;
/* prettier-ignore-end */
