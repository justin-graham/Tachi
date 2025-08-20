/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type CoinsAltSvgrepoComSvgIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function CoinsAltSvgrepoComSvgIcon(
  props: CoinsAltSvgrepoComSvgIconProps
) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"none"}
      viewBox={"0 0 24 24"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        stroke={"currentColor"}
        strokeLinecap={"round"}
        strokeLinejoin={"round"}
        strokeWidth={"2"}
        d={
          "M14 10.5c0 1.38-2.239 2.5-5 2.5s-5-1.12-5-2.5m10 0C14 9.12 11.761 8 9 8s-5 1.12-5 2.5m10 0v4m-10-4v4m16-9C20 4.12 17.761 3 15 3c-1.98 0-3.69.575-4.5 1.409M20 5.5c0 .925-1.006 1.733-2.5 2.166M20 5.5V14c0 .74-1.006 1.387-2.5 1.732M20 10c0 .757-1.05 1.415-2.6 1.755M14 14.5c0 1.38-2.239 2.5-5 2.5s-5-1.12-5-2.5m10 0v4c0 1.38-2.239 2.5-5 2.5s-5-1.12-5-2.5v-4"
        }
      ></path>
    </svg>
  );
}

export default CoinsAltSvgrepoComSvgIcon;
/* prettier-ignore-end */
