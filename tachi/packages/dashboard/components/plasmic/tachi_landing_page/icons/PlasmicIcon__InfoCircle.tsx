/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type InfoCircleIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function InfoCircleIcon(props: InfoCircleIconProps) {
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
          "M8 9.167a.504.504 0 0 1-.5-.5V5.333c0-.273.227-.5.5-.5s.5.227.5.5v3.334c0 .273-.227.5-.5.5m0 2.166a.7.7 0 0 1-.253-.053.8.8 0 0 1-.22-.14.7.7 0 0 1-.14-.22.7.7 0 0 1-.054-.253q.002-.132.054-.254a.8.8 0 0 1 .14-.22.8.8 0 0 1 .22-.14.67.67 0 0 1 .506 0q.12.05.22.14a.8.8 0 0 1 .14.22q.053.122.054.254c0 .086-.02.173-.054.253a.7.7 0 0 1-.14.22.8.8 0 0 1-.22.14.7.7 0 0 1-.253.053"
        }
      ></path>
    </svg>
  );
}

export default InfoCircleIcon;
/* prettier-ignore-end */
