/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type BotSvgrepoComSvgIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function BotSvgrepoComSvgIcon(props: BotSvgrepoComSvgIconProps) {
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

      <path fill={"currentColor"} d={"M14.125 13h-4v2h4z"}></path>

      <path
        fill={"currentColor"}
        fillRule={"evenodd"}
        d={
          "M8.125 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4m0-1.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1m10-.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0m-1.5 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0"
        }
        clipRule={"evenodd"}
      ></path>

      <path
        fill={"currentColor"}
        fillRule={"evenodd"}
        d={
          "M2.749 14.666A6 6 0 0 0 8.125 18h8c2.44 0 4.54-1.456 5.478-3.547A3 3 0 0 0 22.875 12c0-1.013-.503-1.91-1.272-2.452A6 6 0 0 0 16.125 6h-8A6 6 0 0 0 2.75 9.334a3 3 0 0 0 0 5.332M8.125 8h8c1.384 0 2.603.702 3.322 1.77.276.69.428 1.442.428 2.23s-.152 1.54-.428 2.23A4 4 0 0 1 16.125 16h-8a4 4 0 0 1 0-8"
        }
        clipRule={"evenodd"}
      ></path>
    </svg>
  );
}

export default BotSvgrepoComSvgIcon;
/* prettier-ignore-end */
