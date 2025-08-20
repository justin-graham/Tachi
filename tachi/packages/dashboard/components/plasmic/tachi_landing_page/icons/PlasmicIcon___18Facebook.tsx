/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type _18FacebookIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function _18FacebookIcon(props: _18FacebookIconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"none"}
      viewBox={"0 0 18 18"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        fill={"currentColor"}
        d={
          "M15.04 2.25H2.96a.764.764 0 0 0-.71.71v12.08a.715.715 0 0 0 .71.71h6.466v-5.258H7.721v-1.99h1.776v-1.49a2.447 2.447 0 0 1 2.63-2.7c.71 0 1.35.07 1.562.07V6.23h-1.065c-.853 0-.995.427-.995.995v1.279h1.989l-.284 2.06h-1.776v5.187h3.481a.715.715 0 0 0 .711-.71V2.96a.764.764 0 0 0-.71-.71"
        }
      ></path>
    </svg>
  );
}

export default _18FacebookIcon;
/* prettier-ignore-end */
