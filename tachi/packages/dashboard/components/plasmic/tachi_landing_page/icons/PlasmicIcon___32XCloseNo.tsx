/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type _32XCloseNoIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function _32XCloseNoIcon(props: _32XCloseNoIconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"none"}
      viewBox={"0 0 32 32"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        fill={"currentColor"}
        d={
          "m14.586 16-4.243-4.243a1 1 0 0 1 1.414-1.414L16 14.586l4.243-4.243a1 1 0 0 1 1.414 1.414L17.414 16l4.243 4.243a1 1 0 0 1-1.414 1.414L16 17.414l-4.243 4.243a1 1 0 0 1-1.414-1.414z"
        }
      ></path>
    </svg>
  );
}

export default _32XCloseNoIcon;
/* prettier-ignore-end */
