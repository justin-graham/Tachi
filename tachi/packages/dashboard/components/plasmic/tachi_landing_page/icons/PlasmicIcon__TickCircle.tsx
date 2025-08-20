/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type TickCircleIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function TickCircleIcon(props: TickCircleIconProps) {
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
          "M7.053 10.387a.5.5 0 0 1-.353-.147L4.813 8.353a.503.503 0 0 1 0-.706.503.503 0 0 1 .707 0L7.053 9.18l3.427-3.427a.503.503 0 0 1 .707 0 .503.503 0 0 1 0 .707l-3.78 3.78a.5.5 0 0 1-.354.147"
        }
      ></path>
    </svg>
  );
}

export default TickCircleIcon;
/* prettier-ignore-end */
