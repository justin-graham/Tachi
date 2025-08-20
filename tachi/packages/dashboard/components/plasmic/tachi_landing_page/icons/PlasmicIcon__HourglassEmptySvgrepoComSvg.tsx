/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type HourglassEmptySvgrepoComSvgIconProps =
  React.ComponentProps<"svg"> & {
    title?: string;
  };

export function HourglassEmptySvgrepoComSvgIcon(
  props: HourglassEmptySvgrepoComSvgIconProps
) {
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
        fillRule={"evenodd"}
        d={
          "M14 2h-1v2.414L9.414 8 13 11.586V14h1v2H2v-2h1v-2.414L6.586 8 3 4.414V2H2V0h12zM5 2v1.586l3 3 3-3V2zm3 7.414-3 3V14h6v-1.586z"
        }
        clipRule={"evenodd"}
      ></path>
    </svg>
  );
}

export default HourglassEmptySvgrepoComSvgIcon;
/* prettier-ignore-end */
